import { buildCreateBodyObject } from '../utils/utilities';
import category from "../models/categorySchema";
const CategoryBody = require('../dtos/category.response');

const countCategories = async () => {
    const countCategoryResponse = await category.countDocuments();
    return countCategoryResponse;
};

const getAllCategories = async (projection = null) => {
    const limit = 20;
    const offset = 0;
    const options = {};
    const query = {};
    const categories = await category.find(query, projection, options)
        .sort({ "createdAt": -1 })
        .skip(offset)
        .limit(limit)
        .exec();
    const getAllCategoriesResponse = categories.map(
        (category) => new CategoryBody(category)
    );
    const total = await countCategories();
    return {
        limit,
        offset,
        count: getAllCategoriesResponse.length,
        total,
        results: getAllCategoriesResponse,
    };
};

const getCategoryById = async (categoryId: string) => {
    let getCategoryByIdResponse = null;
    const result = await category.findOne({ _id: categoryId });
    if (result) {
        getCategoryByIdResponse = new CategoryBody(result);
    }
    return getCategoryByIdResponse;
};

const createCategory = async ({ clientId, data }) => {
    const nameMap = data.name;
    const nameValues = Object.values(nameMap);
    const localeKeys = Object.keys(nameMap);

    // Dynamically create $or conditions to check localized name fields
    const localeSearchEntries = localeKeys.map((locale) => ({
        [`name.${locale}`]: nameMap[locale]
    }));

    // Search for any category with matching name in any locale
    const existing = await category.findOne({
        $or: localeSearchEntries
    });

    if (existing) {
        const existingNameMap = Object.fromEntries(existing.name);
        const existingNamesValues = Object.values(existingNameMap);

        const duplicateName = nameValues.find(name =>
            existingNamesValues.includes(name)
        );

        return {
            categoryCreated: false,
            code: "DuplicateValue",
            duplicatedValue: duplicateName
        };
    }

    const createCategoryBody = buildCreateBodyObject({ clientId, data });
    const result = await category.create(createCategoryBody);
    const createCategoryResponse = new CategoryBody(result);
    return createCategoryResponse;
};

const deleteCategoryById = async (categoryId: string) => {
    let categoryDeleted = false;
    const deleteCategoryResponse = await category.deleteOne({ _id: categoryId });
    if (deleteCategoryResponse.deletedCount === 1) {
        categoryDeleted = true;
    }
    return { categoryDeleted };
};

const updateCategoryById = async (categoryId: string, updateInfo) => {
    const actions = updateInfo.actions;
    const version = updateInfo.version;
    if (actions[0].action === "changeName") {

        const nameInformation = actions[0].name;

        const updateData = Object.keys(nameInformation).reduce((acc, locale) => {
            acc[`name.${locale}`] = nameInformation[locale];
            return acc;
        }, {});

        const updateResult = await category.updateOne(
            { _id: categoryId, version: version },
            {
                $set: {
                    ...updateData,
                    lastModifiedAt: new Date()
                },
                $inc: { version: 1 }
            }
        );

        if (updateResult.modifiedCount === 1) {
            return await getCategoryById(categoryId);
        }
        // If not modified, check if the category exists
        const existingCategory = await getCategoryById(categoryId);
        if (existingCategory) {
            return {
                categoryUpdated: false,
                code: "ConcurrentModification",
                conflictedVersion: existingCategory.version,
            };
        } else {
            return {
                categoryUpdated: false,
                code: "resourceNotFound",
                message: "Category not found"
            };
        }
    }
};

const categoryExistsById = async (categoryId: string) => {
    const category = await getCategoryById(categoryId);
    return category ? category.updatedAt : null;
};

const headCategories = async () => {
    const latestCategory = await category.findOne().sort({ updatedAt: -1 });
    const lastUpdatedTime = latestCategory.updatedAt;
    const categoryCount = await countCategories();
    return {
        lastUpdatedTime,
        categoryCount
    };
};

export default {
    getAllCategories,
    getCategoryById,
    createCategory,
    deleteCategoryById,
    updateCategoryById,
    categoryExistsById,
    headCategories
};

