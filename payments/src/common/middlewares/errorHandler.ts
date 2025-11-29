import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../dtos/error.response";
import { Logger } from "../loggers/logger";

const logger = new Logger();

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): Response => {
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

    const statusCode = 500;
    const message = "Internal Server Error";
    const code = "InternalServerError";
    const extra = err?.extra || null;

    const response = new ErrorResponse(statusCode, message, code, null, extra);
    logger.error(`Error occurred: ${JSON.stringify(err.message || err)}`);

    return res.status(statusCode).json(response);
};
