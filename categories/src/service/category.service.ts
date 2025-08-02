import { buildCreateBodyObject } from '../common/utils/utilities';
import category from "../models/categorySchema";
import {
    CategoryBody
} from '../common/dtos/category';
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
    sku: LocalizedString
}

interface CreateCategoryParams {
    clientId: string;
    data: CategoryData;
}

// interface DuplicateCategoryResponse {
//     status: false;
//     code: "DuplicateValue";
//     duplicatedValue: string;
//     data: null;
// }

interface ChangeNameAction {
    action: "changeName";
    name: LocalizedString;
}

interface UpdateInfo {
    version: number;
    actions: ChangeNameAction[];
}

// interface ConcurrentModificationResponse {
//     status: false;
//     code: "ConcurrentModification";
//     conflictedVersion: number;
//     data: null;
// }

// interface NotFoundResponse {
//     status: false;
//     code: "ResourceNotFound";
//     message: string;
//     data: null;
// }

const countCategories = async (): Promise<ServiceResponse<number>> => {
    const total = await category.countDocuments();
    return { status: HTTP_STATUS.OK, code: "Success", data: total };
};

const getAllCategories = async (projection: Record<string, unknown> | null = null): Promise<ServiceResponse<any>> => {
    const limit = 20;
    const offset = 0;
    const categories = await category.find({}, projection || {})
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec();
    // Convert Mongoose Map fields to plain objects for CategoryBody
    const results = categories.map((c: any) => {
        const obj = c.toObject();
        return new CategoryBody({
            ...obj,
            name: obj.name instanceof Map ? Object.fromEntries(obj.name) : obj.name,
            slug: obj.slug instanceof Map ? Object.fromEntries(obj.slug) : obj.slug,
            lastModifiedBy: obj.lastModifiedBy === null ? undefined : obj.lastModifiedBy,
            createdBy: obj.createdBy === null ? undefined : obj.createdBy
        });
    });
    const totalRes = await countCategories();
    return {
        status: HTTP_STATUS.OK,
        code: "Success",
        data: {
            limit,
            offset,
            count: results.length,
            total: totalRes.data,
            results
        }
    };
};

const getCategoryById = async (categoryId: string): Promise<ServiceResponse<CategoryBody | null>> => {
    const result = await category.findOne({ _id: categoryId });
    if (result) {
        const obj = result.toObject();
        return {
            status: HTTP_STATUS.OK,
            code: "Success",
            data: new CategoryBody({
                ...obj,
                name: obj.name instanceof Map ? Object.fromEntries(obj.name) : obj.name,
                slug: obj.slug instanceof Map ? Object.fromEntries(obj.slug) : obj.slug,
                lastModifiedBy: obj.lastModifiedBy === null ? undefined : obj.lastModifiedBy,
                createdBy: obj.createdBy === null ? undefined : obj.createdBy
            })
        };
    }
    return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Category not found", data: null };
};

const createCategory = async ({
    clientId,
    data
}: CreateCategoryParams): Promise<ServiceResponse<CategoryBody | null>> => {
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
    const obj = result.toObject();
    return {
        status: HTTP_STATUS.CREATED,
        code: "Success",
        data: new CategoryBody({
            ...obj,
            name: obj.name instanceof Map ? Object.fromEntries(obj.name) : obj.name,
            slug: obj.slug instanceof Map ? Object.fromEntries(obj.slug) : obj.slug,
            lastModifiedBy: obj.lastModifiedBy === null ? undefined : obj.lastModifiedBy,
            createdBy: obj.createdBy === null ? undefined : obj.createdBy
        })
    };
};

const deleteCategoryById = async (categoryId: string): Promise<ServiceResponse<boolean>> => {
    const response = await category.deleteOne({ _id: categoryId });
    if (response.deletedCount === 1) {
        return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
    }
    return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
};

const updateCategoryById = async (
    categoryId: string,
    updateInfo: UpdateInfo
): Promise<ServiceResponse<CategoryBody | null>> => {
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
                $set: {
                    ...updateData,
                    lastModifiedAt: new Date()
                },
                $inc: { version: 1 }
            }
        );
        if (updateResult.modifiedCount === 1) {
            const updated = await category.findOne({ _id: categoryId });
            if (updated) {
                const obj = updated.toObject();
                return {
                    status: HTTP_STATUS.OK,
                    code: "Success",
                    data: new CategoryBody({
                        ...obj,
                        name: obj.name instanceof Map ? Object.fromEntries(obj.name) : obj.name,
                        slug: obj.slug instanceof Map ? Object.fromEntries(obj.slug) : obj.slug,
                        lastModifiedBy: obj.lastModifiedBy === null ? undefined : obj.lastModifiedBy,
                        createdBy: obj.createdBy === null ? undefined : obj.createdBy
                    })
                };
            }
            return {
                status: HTTP_STATUS.NOT_FOUND,
                code: "ResourceNotFound",
                message: "Category not found",
                data: null
            };
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
        return {
            status: HTTP_STATUS.NOT_FOUND,
            code: "ResourceNotFound",
            message: "Category not found",
            data: null
        };
    } else {
        return {
            status: HTTP_STATUS.BAD_REQUEST,
            code: "InvalidAction",
            message: "Unknown action",
            data: null
        };
    }
};

const checkCategoryExistsById = async (categoryId: string): Promise<ServiceResponse<Date | null>> => {
    const result = await category.findOne({ _id: categoryId });
    if (result) {
        return { status: HTTP_STATUS.OK, code: "Success", data: result.lastModifiedAt };
    }
    return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: null };
};

const checkCategoriesExists = async (): Promise<ServiceResponse<{ lastUpdatedTime: Date | undefined; categoryCount: number }>> => {
    const latestCategory = await category.findOne().sort({ lastModifiedAt: -1 });
    const lastUpdatedTime = latestCategory?.lastModifiedAt;
    const totalRes = await countCategories();
    return {
        status: HTTP_STATUS.OK,
        code: "Success",
        data: {
            lastUpdatedTime,
            categoryCount: typeof totalRes.data === 'number' ? totalRes.data : 0
        }
    };
};

export default {
    getAllCategories,
    getCategoryById,
    createCategory,
    deleteCategoryById,
    updateCategoryById,
    checkCategoryExistsById,
    checkCategoriesExists
};