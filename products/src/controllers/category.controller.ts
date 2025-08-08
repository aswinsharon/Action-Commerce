import express from "express";
import categoryService from '../service/category.service';
import { Response } from '../common/dtos/success.response';
import { ErrorResponse } from '../common/dtos/error.response';
import HTTP_STATUS from '../common/constants/httpStatus';

class CategoryController {
    async getAllCategories(_req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const result = await categoryService.getAllCategories();
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    async getCategoryById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { categoryId } = req.params;
        try {
            const result = await categoryService.getCategoryById(categoryId);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with ID '${categoryId}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    async createCategory(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = req.body;
        const clientId = Array.isArray(req.headers['x-client-id']) ? req.headers['x-client-id'][0] : req.headers['x-client-id'] ?? '';
        try {
            const result = await categoryService.createCategory({ clientId, data });
            if (result.code === "DuplicateValue") {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(new ErrorResponse(
                    HTTP_STATUS.BAD_REQUEST,
                    `Category with the name :${result.duplicatedValue} already exists`,
                    result.code
                ));
            }
            res.status(HTTP_STATUS.CREATED).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    async updateCategoryById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { categoryId } = req.params;
        const updateInfo = req.body;
        try {
            const result = await categoryService.updateCategoryById(categoryId, updateInfo);
            if (result.code === "ConcurrentModification") {
                return res.status(HTTP_STATUS.CONFLICT).json(new ErrorResponse(
                    HTTP_STATUS.CONFLICT,
                    `Expected version ${result.conflictedVersion} actual ${updateInfo.version}`,
                    result.code
                ));
            }
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with ID '${categoryId}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    async deleteCategoryById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { categoryId } = req.params;
        try {
            const result = await categoryService.deleteCategoryById(categoryId);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with ID '${categoryId}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
        return null;
    }

    async checkCategoryExistsById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { categoryId } = req.params;
        try {
            const { code, data } = await categoryService.checkCategoryExistsById(categoryId) || {};
            if (code === "Success" && data) {
                res.set('Last-Modified', data.toUTCString());
                return res.status(HTTP_STATUS.OK).end();
            }
            res.status(HTTP_STATUS.NOT_FOUND).end();
        } catch (error) {
            next(error);
        }
        return null;
    }

    async checkCategoriesExists(_req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { data } = await categoryService.checkCategoriesExists() || {};
            if (data) {
                res.set("x-total-count", String(data.categoryCount));
                if (data.lastUpdatedTime) {
                    res.set("last-modified", data.lastUpdatedTime.toUTCString());
                }
            }
            res.status(HTTP_STATUS.OK).end();
        } catch (error) {
            next(error);
        }
        return null;
    }
}

export const categoryController = new CategoryController();