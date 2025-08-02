export interface ErrorDetail {
    code: string;
    message: string;
    detailedErrorMessage?: string;
    extra?: any;
}

export class ErrorResponse {
    statusCode: number;
    message: string;
    errors: ErrorDetail[];

    constructor(
        statusCode: number,
        message: string,
        code: string = "Error",
        detailedErrorMessage: string | null = null,
        extra: any = null
    ) {
        this.statusCode = statusCode;
        this.message = message;

        const errorDetail: ErrorDetail = {
            code,
            message,
        };

        if (detailedErrorMessage) {
            errorDetail.detailedErrorMessage = detailedErrorMessage;
        }

        if (extra) {
            errorDetail.extra = extra;
        }

        this.errors = [errorDetail];
    }
}
