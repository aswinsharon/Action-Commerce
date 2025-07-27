class ErrorResponse {
    constructor(statusCode, message, code = "Error", extra = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.errors = [{
            code,
            message
        }];
        if (extra) {
            this.errors[0] = { ...this.errors[0], ...extra };
        }
    }
};

module.exports = ErrorResponse;