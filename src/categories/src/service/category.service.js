const { buildbaseCreateBody } = require('../utils/utilities');
const category = require("../models/categorySchema");

const countCategories = async () => {
    const countCategoryResponse = await category.countDocuments();
    return countCategoryResponse;
};

const getAllCategories = async () => {
    const limit = 20;
    const offset = 0;
    const projection = null;
    const options = {};
    const query = {};
    const getAllCategoriesResponse = await category.find(query, projection, options)
        .sort({ "createdAt": -1 })
        .skip(offset)
        .limit(limit);
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
    if (!clientId) {
        throw new Error("ClientId missing in the header")
    }
    const createCategoryBody = buildbaseCreateBody({ clientId, data });
    const createCategoryResponse = await category.insertOne(createCategoryBody);
    return createCategoryResponse;
};

const deleteCategoryById = async (categoryId) => {
    const deleteCategoryResponse = await category.deleteOne({ _id: categoryId });
    return deleteCategoryResponse;
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

