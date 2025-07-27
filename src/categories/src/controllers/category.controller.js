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
        next(error);
    }
};

const getCategoryById = async (request, response, next) => {
    const { categoryId } = request.params;
    try {
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
        return response.status(HTTP_STATUS.OK).json(getCategoriesResponse);
    } catch (error) {
        next(error);
    }
};

const createCategory = async (request, response) => {
    const data = request.body;
    const clientId = request?.headers['x-client-id'] || '';
    try {
        const createCategoryResponse = await categoryService.createCategory({ clientId, data });
        console.log(createCategoryResponse);
        return response.status(HTTP_STATUS.CREATED).json(createCategoryResponse);
    } catch (error) {
        next(error);
    }
};

const deleteCategoryById = async (request, response) => {
    const { categoryId } = request.params;
    try {
        const deleteCategoryByIdResponse = await categoryService.deleteCategoryById(categoryId);
        if (!deleteCategoryByIdResponse.categoryDeleted) {
            const errorResponse = new ErrorResponse(
                HTTP_STATUS.NOT_FOUND,
                `The Resource with ID '${categoryId}' was not found.`,
                "ResourceNotFound"
            );
            return response.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
        }
        return response.status(HTTP_STATUS.NO_CONTENT).end();
    } catch (error) {
        console.log(error)
        next(error);
    }
};

const headCategoryById = async (request, response) => {
    const { categoryId } = request.params;
    try {
        const updatedAt = await categoryService.categoryExistsById(categoryId);
        if (!updatedAt) return res.status(404).end();
        res.set('Last-Modified', updatedAt.toUTCString());
        return res.status(HTTP_STATUS.OK).end();
    } catch (err) {
        next(error);
    }
};

const headCategories = async (request, response) => {
    try {
        const headCategoriesResponse = await categoryService.headCategories();
        response.set('X-Total-Count', count);
        if (headCategoriesResponse.lastModified) response.set('Last-Modified', lastModified.toUTCString());
        return response.status(HTTP_STATUS.OK).end();
    } catch (error) {
        next(error);
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