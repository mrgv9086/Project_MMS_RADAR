type ErrorCode = string;

interface ErrorStatusMap {
    [code: string]: number;
}

export abstract class BaseError extends Error {
    abstract readonly statusMap: ErrorStatusMap;

    constructor(
        public code: ErrorCode,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = this.constructor.name;
    }

    get statusCode(): number {
        return this.statusMap[this.code] || 500;
    }

    toJSON() {
        return {
            message: this.message,
            details: this.details,
            statusCode: this.statusCode
        };
    }
}