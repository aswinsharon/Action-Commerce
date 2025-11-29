import Joi from "joi";

const localizedStringSchema = Joi.object().pattern(
    Joi.string(),
    Joi.string()
).required();

const referenceSchema = Joi.object({
    typeId: Joi.string().required(),
    id: Joi.string().required()
});

const moneySchema = Joi.object({
    centAmount: Joi.number().integer().required(),
    currencyCode: Joi.string().length(3).uppercase().required()
});

const imageSchema = Joi.object({
    url: Joi.string().uri().required(),
    label: Joi.string().optional(),
    dimensions: Joi.object({
        w: Joi.number().required(),
        h: Joi.number().required()
    }).required()
});

const attributeSchema = Joi.object({
    name: Joi.string().required(),
    value: Joi.any().required()
});

const priceSchema = Joi.object({
    value: moneySchema.required(),
    country: Joi.string().optional(),
    customerGroup: referenceSchema.optional(),
    channel: referenceSchema.optional(),
    validFrom: Joi.string().isoDate().optional(),
    validUntil: Joi.string().isoDate().optional()
});

const productVariantSchema = Joi.object({
    id: Joi.number().optional(),
    sku: Joi.string().optional(),
    key: Joi.string().optional(),
    prices: Joi.array().items(priceSchema).optional(),
    attributes: Joi.array().items(attributeSchema).optional(),
    images: Joi.array().items(imageSchema).optional()
});

const createProductValidationSchema = Joi.object({
    key: Joi.string().optional(),
    productType: referenceSchema.required().messages({
        "any.required": "productType: Missing required value"
    }),
    name: localizedStringSchema.required().messages({
        "any.required": "name: Missing required value"
    }),
    slug: localizedStringSchema.required().messages({
        "any.required": "slug: Missing required value"
    }),
    description: localizedStringSchema.optional(),
    categories: Joi.array().items(referenceSchema).optional(),
    masterVariant: productVariantSchema.required().messages({
        "any.required": "masterVariant: Missing required value"
    }),
    variants: Joi.array().items(productVariantSchema).optional(),
    taxCategory: referenceSchema.optional(),
    publish: Joi.boolean().optional()
}).required().messages({
    "object.base": "Request body must be a valid object",
    "any.required": "Request body must not be empty"
});

export { createProductValidationSchema };
