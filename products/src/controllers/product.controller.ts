import express from "express";
import productService from '../service/product.service';
import { Response } from '../common/dtos/success.response';
import { ErrorResponse } from '../common/dtos/error.response';
import HTTP_STATUS from '../common/constants/httpStatus';
import { LogMethod } from "../common/decorators/logger.decorators";

class ProductController {

    @LogMethod('DEBUG')
    async getAllProducts(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { page, pageSize } = req.query || {};
            const pageNum = page ? parseInt(page as string, 10) : undefined;
            const pageSizeNum = pageSize ? parseInt(pageSize as string, 10) : undefined;
            const result = await productService.getAllProducts(pageNum, pageSizeNum);
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async getProductById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params;
        try {
            const result = await productService.getProductById(id);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with ID '${id}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async getProductByKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { key } = req.params;
        try {
            const result = await productService.getProductByKey(key);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with key '${key}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async createProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = req.body;
        const clientId = Array.isArray(req.headers['x-client-id']) ? req.headers['x-client-id'][0] : req.headers['x-client-id'] ?? '';
        try {
            const result = await productService.createProduct({ clientId, data });
            if (result.code === "DuplicateValue") {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(new ErrorResponse(
                    HTTP_STATUS.BAD_REQUEST,
                    `Product with the key :${result.duplicatedValue} already exists`,
                    result.code
                ));
            }
            res.status(HTTP_STATUS.CREATED).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async updateProductById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params || {};
        const updateInfo = req.body;
        try {
            const result = await productService.updateProductById(id, updateInfo);
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
                    `The Resource with ID '${id}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async updateProductByKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { key } = req.params || {};
        const updateInfo = req.body;
        try {
            const result = await productService.updateProductByKey(key, updateInfo);
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
                    `The Resource with key '${key}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async deleteProductById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params;
        const { version } = req.query;
        try {
            const result = await productService.deleteProductById(id, version as string);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with ID '${id}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async deleteProductByKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { key } = req.params;
        const { version } = req.query;
        try {
            const result = await productService.deleteProductByKey(key, version as string);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Resource with key '${key}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async checkProductExistsById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params;
        try {
            const { code, data } = await productService.checkProductExistsById(id) || {};
            if (code === "Success" && data) {
                res.set('Last-Modified', new Date(data).toUTCString());
                return res.status(HTTP_STATUS.OK).end();
            }
            res.status(HTTP_STATUS.NOT_FOUND).end();
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async checkProductsExist(_req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { data } = await productService.checkProductsExist() || {};
            if (data) {
                res.set("x-total-count", String(data.productCount));
                if (data.lastUpdatedTime) {
                    res.set("last-modified", new Date(data.lastUpdatedTime).toUTCString());
                }
            }
            res.status(HTTP_STATUS.OK).end();
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async getProductBySku(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { sku } = req.params;
        try {
            const result = await productService.getProductBySku(sku);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `The Product with SKU '${sku}' was not found.`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async getProductsByPriceRange(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { minPrice, maxPrice, currencyCode = 'USD', page, pageSize } = req.query;
        try {
            if (!minPrice || !maxPrice) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(new ErrorResponse(
                    HTTP_STATUS.BAD_REQUEST,
                    "minPrice and maxPrice query parameters are required",
                    "InvalidInput"
                ));
            }
            const result = await productService.getProductsByPriceRange(
                parseInt(minPrice as string, 10),
                parseInt(maxPrice as string, 10),
                currencyCode as string,
                page ? parseInt(page as string, 10) : 1,
                pageSize ? parseInt(pageSize as string, 10) : 10
            );
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async getProductsByCategory(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { categoryId } = req.params;
        const { page, pageSize } = req.query;
        try {
            const result = await productService.getProductsByCategory(
                categoryId,
                page ? parseInt(page as string, 10) : 1,
                pageSize ? parseInt(pageSize as string, 10) : 10
            );
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async updateVariantStock(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id, sku } = req.params;
        const { availableQuantity, isOnStock } = req.body;
        try {
            if (availableQuantity === undefined || isOnStock === undefined) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(new ErrorResponse(
                    HTTP_STATUS.BAD_REQUEST,
                    "availableQuantity and isOnStock are required",
                    "InvalidInput"
                ));
            }
            const result = await productService.updateVariantStock(id, sku, availableQuantity, isOnStock);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `Product or variant not found`,
                    "ResourceNotFound"
                ));
            }
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }
}

export const productController = new ProductController();
