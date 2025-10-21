import { buildCreateBodyObject } from '../common/utils/utilities';
import category from '../models/categorySchema';
import { CategoryBody } from '../common/dtos/category';
import HTTP_STATUS from '../common/constants/httpStatus';

interface ServiceResponse<T> {
    status: number;
    code: string;
    message?: string;
    data?: T;
    [key: string]: any;
}

interface LocalizedString {
    [locale: string]: string;
}

interface CategoryData {
    name: LocalizedString;
    sku?: LocalizedString;
}

interface CreateCategoryParams {
    clientId: string;
    data: CategoryData;
}

interface ChangeNameAction {
    action: "changeName";
    name: LocalizedString;
}

interface UpdateInfo {
    version: number;
    actions: ChangeNameAction[];
}

class CategoryService {
    static formatCategory(doc: any) {
        if (!doc) return null;
        const obj = doc.toObject();
        return new CategoryBody({
            ...obj,
            name: obj.name instanceof Map ? Object.fromEntries(obj.name) : obj.name,
            slug: obj.slug instanceof Map ? Object.fromEntries(obj.slug) : obj.slug,
            lastModifiedBy: obj.lastModifiedBy === null ? undefined : obj.lastModifiedBy,
            createdBy: obj.createdBy === null ? undefined : obj.createdBy
        });
    }

    static async countCategories(): Promise<ServiceResponse<number>> {
        const total = await category.countDocuments();
        return { status: HTTP_STATUS.OK, code: "Success", data: total };
    }

    static async getAllCategories(page = 0, pageSize = 10, projection: Record<string, unknown> | null = null): Promise<ServiceResponse<any>> {
        const limit = pageSize > 0 ? pageSize : 10;
        const offset = page > 0 ? (page - 1) * limit : 0;
        const categories = await category.find({}, projection || {})
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .exec();
        const results = categories.map(CategoryService.formatCategory);
        const totalRes = await CategoryService.countCategories();
        const totalPages = totalRes.data && limit ? Math.ceil(totalRes.data / limit) : 0;
        if (page > totalPages && totalPages > 0) {
            page = totalPages;
        }
        return {
            status: HTTP_STATUS.OK,
            code: "Success",
            data: { page, pageSize: results.length, totalPages, total: totalRes.data, results }
        };
    }

    static async getCategoryById(categoryId: string): Promise<ServiceResponse<CategoryBody | null>> {
        const result = await category.findOne({ _id: categoryId });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: CategoryService.formatCategory(result) };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Category not found", data: null };
    }

    static async createCategory({ clientId, data }: CreateCategoryParams): Promise<ServiceResponse<CategoryBody | null>> {
        const nameMap = data.name;
        const nameValues = Object.values(nameMap);
        const localeKeys = Object.keys(nameMap);
        const localeSearchEntries = localeKeys.map((locale) => ({ [`name.${locale}`]: nameMap[locale] }));
        const existing = await category.findOne({ $or: localeSearchEntries });
        if (existing) {
            const existingNameMap = existing.name instanceof Map ? Object.fromEntries(existing.name) : existing.name;
            const duplicateName = nameValues.find(name => Object.values(existingNameMap).includes(name));
            return {
                status: HTTP_STATUS.BAD_REQUEST,
                code: "DuplicateValue",
                duplicatedValue: duplicateName || "Unknown",
                data: null
            };
        }
        const createBody = buildCreateBodyObject({ clientId, data });
        const result = await category.create(createBody);
        return {
            status: HTTP_STATUS.CREATED,
            code: "Success",
            data: CategoryService.formatCategory(result)
        };
    }

    static async deleteCategoryById(categoryId: string): Promise<ServiceResponse<boolean>> {
        const response = await category.deleteOne({ _id: categoryId });
        if (response.deletedCount === 1) {
            return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async updateCategoryById(categoryId: string, updateInfo: UpdateInfo): Promise<ServiceResponse<CategoryBody | null>> {
        const { actions, version } = updateInfo;
        if (actions.length && actions[0].action === "changeName") {
            const nameInfo = actions[0].name;
            const updateData = Object.keys(nameInfo).reduce<Record<string, string>>((acc, locale) => {
                acc[`name.${locale}`] = nameInfo[locale];
                return acc;
            }, {});
            const updateResult = await category.updateOne(
                { _id: categoryId, version },
                {
                    $set: { ...updateData, lastModifiedAt: new Date() },
                    $inc: { version: 1 }
                }
            );
            if (updateResult.modifiedCount === 1) {
                const updated = await category.findOne({ _id: categoryId });
                if (updated) {
                    return { status: HTTP_STATUS.OK, code: "Success", data: CategoryService.formatCategory(updated) };
                }
                return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Category not found", data: null };
            }
            const existing = await category.findOne({ _id: categoryId });
            if (existing) {
                return {
                    status: HTTP_STATUS.CONFLICT,
                    code: "ConcurrentModification",
                    conflictedVersion: existing.version,
                    data: null
                };
            }
            return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Category not found", data: null };
        }
        return { status: HTTP_STATUS.BAD_REQUEST, code: "InvalidAction", message: "Unknown action", data: null };
    }

    static async checkCategoryExistsById(categoryId: string): Promise<ServiceResponse<Date | null>> {
        const result = await category.findOne({ _id: categoryId });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: result.lastModifiedAt };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: null };
    }

    static async checkCategoriesExists(): Promise<ServiceResponse<{ lastUpdatedTime: Date | undefined; categoryCount: number }>> {
        const latestCategory = await category.findOne().sort({ lastModifiedAt: -1 });
        const lastUpdatedTime = latestCategory?.lastModifiedAt;
        const totalRes = await CategoryService.countCategories();
        return {
            status: HTTP_STATUS.OK,
            code: "Success",
            data: {
                lastUpdatedTime,
                categoryCount: typeof totalRes.data === 'number' ? totalRes.data : 0
            }
        };
    }
}

export default CategoryService;