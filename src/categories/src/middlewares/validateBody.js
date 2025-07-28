const Joi = require("joi");

module.exports = function validateBody(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => ({
                code: "InvalidJsonInput",
                message: "Request body does not contain valid JSON.",
                detailedErrorMessage: detail.message
            }));

            return res.status(400).json({
                statusCode: 400,
                message: "Request body does not contain valid JSON.",
                errors
            });
        }

        next();
    };
};