export interface ResponseType {
    statusCode: number;
    code: string;
    message?: string;
    data?: any;
}

export class Response {
    statusCode: number;
    code?: string;
    message?: string;
    data?: any;

    constructor(rawResponse: any) {
        this.statusCode = rawResponse.status;

        if (rawResponse.code) {
            this.code = rawResponse.code;
        }

        if (rawResponse.message) {
            this.message = rawResponse.message;
        }

        if (rawResponse.data) {
            this.data = rawResponse.data;
        }
    }
}