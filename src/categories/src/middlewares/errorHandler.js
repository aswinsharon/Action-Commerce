const ErrorResponse = require("../dtos/error.response");

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const code = "InternalServerError"
    const errors = err.errors || [message];
    const response = new ErrorResponse(statusCode, code);
    return res.status(statusCode).json(response);
};

module.exports = errorHandler;