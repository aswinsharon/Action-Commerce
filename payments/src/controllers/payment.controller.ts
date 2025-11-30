import express from "express";
import paymentService from '../service/payment.service';
import { Response } from '../common/dtos/success.response';
import { ErrorResponse } from '../common/dtos/error.response';
import HTTP_STATUS from '../common/constants/httpStatus';
import { LogMethod } from "../common/decorators/logger.decorators";

class PaymentController {

    @LogMethod('DEBUG')
    async getAllPayments(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { page, pageSize } = req.query || {};
            const pageNum = page ? parseInt(page as string, 10) : undefined;
            const pageSizeNum = pageSize ? parseInt(pageSize as string, 10) : undefined;
            const result = await paymentService.getAllPayments(pageNum, pageSizeNum);
            res.status(HTTP_STATUS.OK).json(new Response(result));
        } catch (error) {
            next(error);
        }
        return null;
    }

    @LogMethod('DEBUG')
    async getPaymentById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params;
        try {
            const result = await paymentService.getPaymentById(id);
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
    async getPaymentByKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { key } = req.params;
        try {
            const result = await paymentService.getPaymentByKey(key);
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
    async createPayment(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = req.body;
        const clientId = Array.isArray(req.headers['x-client-id']) ? req.headers['x-client-id'][0] : req.headers['x-client-id'] ?? '';
        try {
            const result = await paymentService.createPayment({ clientId, data });
            if (result.code === "DuplicateValue") {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(new ErrorResponse(
                    HTTP_STATUS.BAD_REQUEST,
                    `Payment with the key :${result.duplicatedValue} already exists`,
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
    async updatePaymentById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params || {};
        const updateInfo = req.body;
        try {
            const result = await paymentService.updatePaymentById(id, updateInfo);
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
    async updatePaymentByKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { key } = req.params || {};
        const updateInfo = req.body;
        try {
            const result = await paymentService.updatePaymentByKey(key, updateInfo);
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
    async deletePaymentById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params;
        const { version } = req.query;
        try {
            const result = await paymentService.deletePaymentById(id, version as string);
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
    async deletePaymentByKey(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { key } = req.params;
        const { version } = req.query;
        try {
            const result = await paymentService.deletePaymentByKey(key, version as string);
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
    async checkPaymentExistsById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const { id } = req.params;
        try {
            const { code, data } = await paymentService.checkPaymentExistsById(id) || {};
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
    async checkPaymentsExist(_req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { data } = await paymentService.checkPaymentsExist() || {};
            if (data) {
                res.set("x-total-count", String(data.paymentCount));
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

export const paymentController = new PaymentController();
