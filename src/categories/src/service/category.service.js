const { buildbaseCreateBody } = require('../utils/utilities');
const category = require("../models/categorySchema");
const CategoryResponse = require('../dtos/category.response');

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
        (category) => new CategoryResponse(category)
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

const getCategoryById = async (categoryId) => {
    const getCategoryByIdResponse = await category.findOne({ _id: categoryId });
    return getCategoryByIdResponse;
};

const createCategory = async ({ clientId, data }) => {
    const nameMap = data.name;
    const nameValues = Object.values(nameMap);
    const localeKeys = Object.keys(nameMap);
    const localeSearchEntries = [];
    localeKeys.forEach((locale) => {
        localeSearchEntries.push({ [`name.${locale}`]: nameMap[locale] })
    });
    const existing = await category.findOne({
        $or: nameValues.map(value => ({
            $or: [
                { "name.en": value },
                { "name.de": value },
                { "name.fr": value },
            ]
        })).flat()
    });
    if (existing) {
        const existingNames = Object.values(existing.name || {});
        const duplicateName = nameValues.find(name => existingNames.includes(name));
        return {
            categoryCreated: false,
            code: "DuplicateValue",
            duplicatedValue: duplicateName
        }
    }
    const createCategoryBody = buildbaseCreateBody({ clientId, data });
    const createCategoryResponse = await category.insertOne(createCategoryBody);
    return createCategoryResponse;
};

const deleteCategoryById = async (categoryId) => {
    let categoryDeleted = false;
    const deleteCategoryResponse = await category.deleteOne({ _id: categoryId });
    if (deleteCategoryResponse.deletedCount === 1) {
        categoryDeleted = true;
    }
    return { categoryDeleted };
};

const headCategoryById = async (categoryId) => {
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

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    deleteCategoryById,
    headCategoryById,
    headCategories
};

