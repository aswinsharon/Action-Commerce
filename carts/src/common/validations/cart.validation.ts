import Joi from "joi";

const createCartValidationSchema = Joi.object({
    key: Joi.string().optional(),
    currency: Joi.string().length(3).uppercase().required().messages({
        "any.required": "currency: Missing required value",
        "string.length": "currency: Must be a 3-letter currency code"
    }),
    customerId: Joi.string().optional(),
    customerEmail: Joi.string().email().optional(),
    lineItems: Joi.array().optional()
}).required().messages({
    "object.base": "Request body must be a valid object",
    "any.required": "Request body must not be empty"
});

export { createCartValidationSchema };
