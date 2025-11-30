import express from "express";
import cartService from '../service/cart.service';
import { Response } from '../common/dtos/success.response';
import { ErrorResponse } from '../common/dtos/error.response';
import HTTP_STATUS from '../common/constants/httpStatus';
import { LogMethod } from "../common/decorators/logger.decorators";

class CartController {

    @LogMethod('DEBUG')
    async getAllCarts(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { page, pageSize } = req.query || {};
            const pageNum = page ? parseInt(page as string, 10) : undefined;
            const pageSizeNum = pageSize ? parseInt(pageSize as string, 10) : undefined;
            const result = await cartService.getAllCarts(pageNum, pageSizeNum);
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async getCartById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params;
        try {
            const result = await cartService.getCartById(id);
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
    async getCartByKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { key } = req.params;
        try {
            const result = await cartService.getCartByKey(key);
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
    async getCartByCustomerId(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { customerId } = req.params;
        try {
            const result = await cartService.getCartByCustomerId(customerId);
            if (result.code === "ResourceNotFound") {
                return res.status(HTTP_STATUS.NOT_FOUND).json(new ErrorResponse(
                    HTTP_STATUS.NOT_FOUND,
                    `No active cart found for customer '${customerId}'.`,
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
    async createCart(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = req.body;
        const clientId = Array.isArray(req.headers['x-client-id']) ? req.headers['x-client-id'][0] : req.headers['x-client-id'] ?? '';
        try {
            const result = await cartService.createCart({ clientId, data });
            if (result.code === "DuplicateValue") {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(new ErrorResponse(
                    HTTP_STATUS.BAD_REQUEST,
                    `Cart with the key :${result.duplicatedValue} already exists`,
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
    async updateCartById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params || {};
        const updateInfo = req.body;
        try {
            const result = await cartService.updateCartById(id, updateInfo);
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
    async updateCartByKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { key } = req.params || {};
        const updateInfo = req.body;
        try {
            const result = await cartService.updateCartByKey(key, updateInfo);
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
    async deleteCartById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params;
        const { version } = req.query;
        try {
            const result = await cartService.deleteCartById(id, version as string);
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
    async deleteCartByKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { key } = req.params;
        const { version } = req.query;
        try {
            const result = await cartService.deleteCartByKey(key, version as string);
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
    async checkCartExistsById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params;
        try {
            const { code, data } = await cartService.checkCartExistsById(id) || {};
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
    async checkCartsExist(_req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { data } = await cartService.checkCartsExist() || {};
            if (data) {
                res.set("x-total-count", String(data.cartCount));
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
}

export const cartController = new CartController();
