import { BaseError } from "./base/base_error";

export enum StorageErrorCode {
    STORAGE_NOT_FOUND = "STORAGE_NOT_FOUND",
    STORAGE_NOT_EMPTY = "STORAGE_NOT_EMPTY",
}

export class StorageError extends BaseError {
    readonly statusMap: Record<StorageErrorCode, number> = {
        [StorageErrorCode.STORAGE_NOT_FOUND]: 404,
        [StorageErrorCode.STORAGE_NOT_EMPTY]: 409,
    };

    constructor(code: StorageErrorCode, message: string, details?: any) {
        super(code, message, details);
    }
}