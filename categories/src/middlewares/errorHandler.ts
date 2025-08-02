import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../common/dtos/error.response";
import { Logger } from "../common/loggers/logger";

const logger = new Logger();

export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): Response => {
    const statusCode = err.statusCode || 500;
    const message = "Internal Server Error";
    const code = "InternalServerError";
    const detailedErrorMessage = err?.message || null;
    const extra = err?.extra || null;

    const response = new ErrorResponse(statusCode, message, code, detailedErrorMessage, extra);

    logger.error(`Error occurred: ${JSON.stringify(response)}`);

    return res.status(statusCode).json(response);
};