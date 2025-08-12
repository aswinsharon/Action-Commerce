import express from "express";
import ProductService from '../service/Product.service';
import { Response } from '../common/dtos/success.response';
import { ErrorResponse } from '../common/dtos/error.response';
import HTTP_STATUS from '../common/constants/httpStatus';

class ProductController {
    async getAllCategories(_req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const result = await ProductService.getAllCategories();
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    async getProductById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { ProductId } = req.params;
        try {
            const result = await ProductService.getProductById(ProductId);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with ID '${ProductId}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    async createProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = req.body;
        const clientId = Array.isArray(req.headers['x-client-id']) ? req.headers['x-client-id'][0] : req.headers['x-client-id'] ?? '';
        try {
            const result = await ProductService.createProduct({ clientId, data });
            if (result.code === "DuplicateValue") {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(new ErrorResponse(
                    HTTP_STATUS.BAD_REQUEST,
                    `Product with the name :${result.duplicatedValue} already exists`,
                    result.code
                ));
            }
            res.status(HTTP_STATUS.CREATED).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    async updateProductById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { ProductId } = req.params;
        const updateInfo = req.body;
        try {
            const result = await ProductService.updateProductById(ProductId, updateInfo);
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
                    `The Resource with ID '${ProductId}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    async deleteProductById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { ProductId } = req.params;
        try {
            const result = await ProductService.deleteProductById(ProductId);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with ID '${ProductId}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
        return null;
    }

    async checkProductExistsById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { ProductId } = req.params;
        try {
            const { code, data } = await ProductService.checkProductExistsById(ProductId) || {};
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
            const { data } = await ProductService.checkCategoriesExists() || {};
            if (data) {
                res.set("x-total-count", String(data.ProductCount));
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

export const productController = new ProductController();