class ErrorResponse {
    constructor(statusCode, message, code = "Error", detailedErrorMessage = null, extra = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.errors = [{
            code,
            message
        }];
        if (detailedErrorMessage) {
            this.errors[0] = { ...this.errors[0], detailedErrorMessage };
        }
    }
};

module.exports = ErrorResponse;