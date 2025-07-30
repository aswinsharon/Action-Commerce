import { Request, Response, NextFunction } from "express";
import { ObjectSchema, ValidationErrorItem } from "joi";
import HTTP_STATUS from "../constants/httpStatus";

/**
 * Middleware to validate request body against a Joi schema
 * @param schema Joi object schema
 */
export function validateBody(schema: ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map((detail: ValidationErrorItem) => ({
                code: "InvalidJsonInput",
                message: "Request body does not contain valid JSON.",
                detailedErrorMessage: detail.message
            }));

            res.status(HTTP_STATUS.BAD_REQUEST).json({
                statusCode: HTTP_STATUS.BAD_REQUEST,
                message: "Request body does not contain valid JSON.",
                errors
            });
            return;
        }

        next();
    };
}