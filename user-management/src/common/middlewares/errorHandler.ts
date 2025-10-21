import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../dtos/error.response";
import { Logger } from "../loggers/logger";

const logger = new Logger();

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): Response => {
    // Log the full error details for debugging
    logger.error(`Error occurred on ${req.method} ${req.path}: ${err.stack || err.message || err}`);

    if (err instanceof SyntaxError && 'body' in err) {
        logger.error(`Invalid JSON: ${err.message}`);
        return res.status(400).json(
            new ErrorResponse(
                400,
                "Request body does not contain valid JSON.",
                "InvalidJsonInput",
                "JSON object expected."
            )
        );
    }

    // Don't expose internal error details in production
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production'
        ? "Internal Server Error"
        : err.message || "Internal Server Error";
    const code = "InternalServerError";

    const response = new ErrorResponse(statusCode, message, code);

    return res.status(statusCode).json(response);
};