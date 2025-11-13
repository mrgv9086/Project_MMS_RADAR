import { BaseError } from "./base/base_error";

export enum FileErrorCode {
    UNSUPPORTED_CONTENT_TYPE = 'UNSUPPORTED_CONTENT_TYPE',
    FILE_ALREADY_EXISTS = "FILE_ALREADY_EXISTS",
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
}


export class FileError extends BaseError {

    readonly statusMap: Record<FileErrorCode, number> = {
        [FileErrorCode.UNSUPPORTED_CONTENT_TYPE]: 400,
        [FileErrorCode.FILE_ALREADY_EXISTS]: 409,
        [FileErrorCode.FILE_NOT_FOUND]: 404,
        [FileErrorCode.DOWNLOAD_ERROR]: 500,
    }

    constructor(
        public code: FileErrorCode,
        message: string,
        public details?: any
    ) {
        super(code, message, details);
    }
}