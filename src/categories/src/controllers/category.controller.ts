import { Request, Response, NextFunction } from "express";
import categoryService from '../service/category.service';
import { ErrorResponse } from '../dtos/error.response';
import HTTP_STATUS from '../constants/httpStatus';

const getAllCategories = async (_request: Request, response: Response, next: NextFunction) => {
    try {
        const getCategoriesResponse = await categoryService.getAllCategories();
        return response.status(HTTP_STATUS.OK).json(getCategoriesResponse);
    } catch (error) {
        return next(error);
    }
};

const getCategoryById = async (request: Request, response: Response, next: NextFunction) => {
    const { categoryId } = request.params;
    console.log("under getCategoryById", categoryId)
    try {
        const getCategoriesResponse = await categoryService.getCategoryById(categoryId);
        console.log("getCategoriesResponse", getCategoriesResponse);
        if (getCategoriesResponse.code === "ResourceNotFound") {
            const errorResponse = new ErrorResponse(
                HTTP_STATUS.NOT_FOUND,
                `The Resource with ID '${categoryId}' was not found.`,
                "ResourceNotFound"
            );
            return response.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
        }
        return response.status(HTTP_STATUS.OK).json(getCategoriesResponse);
    } catch (error) {
        return next(error);
    }
};

const createCategory = async (request: Request, response: Response, next: NextFunction) => {
    const data = request.body;
    const clientId = Array.isArray(request.headers['x-client-id'])
        ? request.headers['x-client-id'][0]
        : request.headers['x-client-id'] ?? '';
    try {
        const createCategoryResponse = await categoryService.createCategory({ clientId, data });
        if (!createCategoryResponse.categoryCreated && createCategoryResponse.duplicatedValue) {
            return response.status(HTTP_STATUS.BAD_REQUEST).json(new ErrorResponse(HTTP_STATUS.BAD_REQUEST, "Request body does not contain valid JSON.",
                createCategoryResponse.code, `Category with the name :${createCategoryResponse.duplicatedValue} already exists`
            ));
        }
        return response.status(HTTP_STATUS.CREATED).json(createCategoryResponse);
    } catch (error) {
        return next(error);
    }
};

const updateCategoryById = async (request: Request, response: Response, next: NextFunction) => {
    const { categoryId } = request.params;
    const updateInfo = request.body;
    try {
        const updateCategoryByIdResult = await categoryService.updateCategoryById(categoryId, updateInfo);
        if (!updateCategoryByIdResult?.categoryUpdated) {
            if (updateCategoryByIdResult?.code === "ConcurrentModification") {
                return response.status(HTTP_STATUS.CONFLICT).json(new ErrorResponse(HTTP_STATUS.CONFLICT,
                    `Expected version ${updateCategoryByIdResult.conflictedVersion} actual ${updateInfo.version}`,
                    updateCategoryByIdResult.code
                ));
            } else if (updateCategoryByIdResult.code === "ResourceNotFound") {
                return response.status(HTTP_STATUS.BAD_REQUEST).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with ID '${categoryId}' was not found.`,
                    "ResourceNotFound"
                ));
            }
        }
        return response.status(HTTP_STATUS.OK).json(updateCategoryByIdResult);
    } catch (error) {
        return next(error);
    }
};

const deleteCategoryById = async (request: Request, response: Response, next: NextFunction) => {
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
        return next(error);
    }
};

const checkCategoryExistsById = async (request: Request, response: Response, next: NextFunction) => {
    const { categoryId } = request.params;
    try {
        const { code, data } = await categoryService.checkCategoryExistsById(categoryId) || {};
        console.log("headCategoryById", code, data);
        if (code === "Success" && data) {
            response.set('Last-Modified', data.toUTCString());
            return response.status(HTTP_STATUS.OK).end();
        }
        return response.status(HTTP_STATUS.NOT_FOUND).end();
    } catch (error) {
        console.log("error", error)
        return next(error);
    }
};

const checkCategoriesExists = async (_request: Request, response: Response, next: NextFunction) => {
    console.log("checkCategoriesExists called");
    try {
        const headCategoriesResponse = await categoryService.checkCategoriesExists();
        const { categoryCount, lastUpdatedTime } = headCategoriesResponse || {};
        response.set("x-total-count", String(categoryCount));
        if (headCategoriesResponse.lastUpdatedTime) {
            response.set("last-modified", lastUpdatedTime.toUTCString());
        }
        return response.status(HTTP_STATUS.OK).end();
    } catch (error) {
        return next(error);
    }
};

export default {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategoryById,
    deleteCategoryById,
    checkCategoryExistsById,
    checkCategoriesExists
};