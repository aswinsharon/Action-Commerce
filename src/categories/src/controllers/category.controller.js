const { buildbaseCreateBody, paginate } = require('../utils/utilities');
const categoryService = require('../service/category.service');
const CategoryResponse = require("../dtos/category.response");
const ErrorResponse = require('../dtos/error.response');
const HTTP_STATUS = require('../constants/httpStatus');

const getAllCategories = async (request, response) => {
    try {
        const getCategoriesResponse = await categoryService.getAllCategories();
        return response.status(200).json(getCategoriesResponse);
    } catch (error) {
        console.log(error)
        return response.status(500).json(error);
    }
};

const getCategoryById = async (request, response) => {
    try {
        const { categoryId } = request.params;
        const result = await categoryService.getCategoryById(categoryId);
        if (!result) {
            const errorResponse = new ErrorResponse(
                HTTP_STATUS.NOT_FOUND,
                `The Resource with ID '${categoryId}' was not found.`,
                "ResourceNotFound"
            );
            return response.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
        }
        const getCategoriesResponse = new CategoryResponse(result);
        return response.status(200).json(getCategoriesResponse);
    } catch (error) {
        console.log(error);
        return response.status(500).json(error);
    }
};

const createCategory = async (request, response) => {
    const data = request.body;
    const clientId = request?.headers['x-client-id'] || '';
    try {
        const createCategoryResponse = await categoryService.createCategory({ clientId, data });
        return response.status(201).json(createCategoryResponse);
    } catch (error) {
        return response.status(500).json(error);
    }
};

const deleteCategoryById = async (request, response) => {
    const categoryId = request.id;
    try {
        const deleteCategoryByIdResponse = await categoryService.deleteCategoryById(categoryId);
        return response.status(204).end();
    } catch (error) {
        return response.status(500).json(error)
    }
};

const headCategoryById = async (request, response) => {
    try {
        const updatedAt = await categoryService.categoryExistsById(request.id);
        if (!updatedAt) return res.status(404).end();
        res.set('Last-Modified', updatedAt.toUTCString());
        return res.status(200).end();
    } catch (err) {
        return res.status(500).end();
    }
};

const headCategories = async (request, response) => {
    try {
        const headCategoriesResponse = await categoryService.headCategories();
        response.set('X-Total-Count', count);
        if (headCategoriesResponse.lastModified) response.set('Last-Modified', lastModified.toUTCString());
        return response.status(200).end();
    } catch (error) {
        return response.status(500).json(error);
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    deleteCategoryById,
    headCategoryById,
    headCategories
};