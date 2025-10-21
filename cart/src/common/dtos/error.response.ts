export class ErrorResponse {
    statusCode: number;
    message: string;
    code: string;
    detailMessage?: string;
    extra?: any;

    constructor(
        statusCode: number,
        message: string,
        code: string,
        detailMessage?: string,
        extra?: any
    ) {
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.detailMessage = detailMessage;
        this.extra = extra;
    }
}