export enum StorageErrorCode {
    STORAGE_NOT_FOUND = "STORAGE_NOT_FOUND",
    STORAGE_NOT_EMPTY = "STORAGE_NOT_EMPTY",
}

export class StorageError extends Error {

    private static statusMap: Record<StorageErrorCode, number> = {
        [StorageErrorCode.STORAGE_NOT_FOUND]: 404,
        [StorageErrorCode.STORAGE_NOT_EMPTY]: 409
    }

    constructor(
        public code: StorageErrorCode,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'AuthError';
        this.code = code;
    }

    get statusCode(): number {
        return StorageError.statusMap[this.code]
    }
}