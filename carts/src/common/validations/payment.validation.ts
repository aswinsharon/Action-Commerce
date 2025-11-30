import Joi from "joi";

const moneySchema = Joi.object({
    centAmount: Joi.number().integer().required().messages({
        "any.required": "centAmount: Missing required value",
        "number.base": "centAmount: Must be a number"
    }),
    currencyCode: Joi.string().length(3).uppercase().required().messages({
        "any.required": "currencyCode: Missing required value",
        "string.length": "currencyCode: Must be a 3-letter currency code"
    })
});

const referenceSchema = Joi.object({
    typeId: Joi.string().required().messages({
        "any.required": "typeId: Missing required value"
    }),
    id: Joi.string().required().messages({
        "any.required": "id: Missing required value"
    })
});

const localizedStringSchema = Joi.object().pattern(
    Joi.string(),
    Joi.string()
);

const createPaymentValidationSchema = Joi.object({
    key: Joi.string().optional(),
    amountPlanned: moneySchema.required().messages({
        "any.required": "amountPlanned: Missing required value"
    }),
    customer: referenceSchema.optional(),
    paymentMethodInfo: Joi.object({
        paymentInterface: Joi.string().optional(),
        method: Joi.string().optional(),
        name: localizedStringSchema.optional()
    }).optional()
}).required().messages({
    "object.base": "Request body must be a valid object",
    "any.required": "Request body must not be empty"
});

export { createPaymentValidationSchema };
