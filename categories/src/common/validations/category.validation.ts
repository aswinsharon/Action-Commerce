const Joi = require("joi");
const { supportedLocales } = require("../utils/locales");

const localizedStringSchema = Joi.object().custom((value: any, helpers: any) => {
    if (typeof value !== "object" || Array.isArray(value)) {
        return helpers.error("object.base");
    }

    const invalidLocales = Object.keys(value).filter((locale) =>
        !supportedLocales.includes(locale.toLowerCase())
    );

    if (invalidLocales.length > 0) {
        return helpers.error("object.invalidLocale", { invalidLocales });
    }

    for (const key in value) {
        if (typeof value[key] !== "string") {
            return helpers.error("object.valueNotString", { key });
        }
    }

    return value;
}, "Localized String Validation").messages({
    "object.base": "{{#label}} must be an object with locale keys",
    "object.invalidLocale": "{{#label}}: locale(s) {{#invalidLocales}} are not supported",
    "object.valueNotString": "{{#label}}: value for locale '{{#key}}' must be a string"
});

const createCategoryValidationSchema = Joi.object({
    name: localizedStringSchema.required().messages({
        "any.required": "name: Missing required value"
    }),
    slug: localizedStringSchema.required().messages({
        "any.required": "slug: Missing required value"
    })
});

export { createCategoryValidationSchema };

