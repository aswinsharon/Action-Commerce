import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../dtos/error.response";

export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): Response => {
    console.log(err)
    const statusCode = err.statusCode || 500;
    const message = "Internal Server Error";
    const code = "InternalServerError";
    const detailedErrorMessage = err?.message || null;
    const extra = err?.extra || null;

    const response = new ErrorResponse(statusCode, message, code, detailedErrorMessage, extra);

    return res.status(statusCode).json(response);
};