import express from "express";
import categoryService from '../service/category.service';
import { Response } from '../common/dtos/success.response';
import { ErrorResponse } from '../common/dtos/error.response';
import HTTP_STATUS from '../common/constants/httpStatus';

class CategoryController {

    async getAllCategories(_request: express.Request, response: express.Response, next: express.NextFunction) {
        try {
            const getCategoriesResponse = await categoryService.getAllCategories();
            return response.status(HTTP_STATUS.OK).json(new Response(getCategoriesResponse));
        } catch (error) {
            return next(error);
        }
    };

    async getCategoryById(request: express.Request, response: express.Response, next: express.NextFunction) {
        const { categoryId } = request.params;
        try {
            const getCategoriesResponse = await categoryService.getCategoryById(categoryId);
            if (getCategoriesResponse.code === "ResourceNotFound") {
                const errorResponse = new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with ID '${categoryId}' was not found.`,
                    "ResourceNotFound"
                );
                return response.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
            }
            return response.status(HTTP_STATUS.OK).json(new Response(getCategoriesResponse));
        } catch (error) {
            return next(error);
        }
    };

    async createCategory(request: express.Request, response: express.Response, next: express.NextFunction) {
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
            return response.status(HTTP_STATUS.CREATED).json(new Response(createCategoryResponse));
        } catch (error) {
            return next(error);
        }
    };

    async updateCategoryById(request: express.Request, response: express.Response, next: express.NextFunction) {
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
            return response.status(HTTP_STATUS.OK).json(new Response(updateCategoryByIdResult));
        } catch (error) {
            console.error("Error in updateCategoryById:", error);
            return next(error);
        }
    };

    async deleteCategoryById(request: express.Request, response: express.Response, next: express.NextFunction) {
        const { categoryId } = request.params;
        try {
            const deleteCategoryByIdResponse = await categoryService.deleteCategoryById(categoryId);
            if (deleteCategoryByIdResponse.code === "ResourceNotFound") {
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

    async checkCategoryExistsById(request: express.Request, response: express.Response, next: express.NextFunction) {
        const { categoryId } = request.params;
        try {
            const { code, data } = await categoryService.checkCategoryExistsById(categoryId) || {};
            if (code === "Success" && data) {
                response.set('Last-Modified', data.toUTCString());
                return response.status(HTTP_STATUS.OK).end();
            }
            return response.status(HTTP_STATUS.NOT_FOUND).end();
        } catch (error) {
            return next(error);
        }
    };

    async checkCategoriesExists(_request: express.Request, response: express.Response, next: express.NextFunction) {
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

};

export const categoryController = new CategoryController();