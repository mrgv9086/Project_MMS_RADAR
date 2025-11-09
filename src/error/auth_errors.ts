export enum AuthErrorCode {
    USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    INVALID_TOKEN_TYPE = "INVALID_TOKEN_TYPE",
    TOKEN_REVOKED = 'TOKEN_REVOKED',
}

export class AuthError extends Error {

    private static statusMap: Record<AuthErrorCode, number> = {
        [AuthErrorCode.USER_ALREADY_EXISTS]: 400,
        [AuthErrorCode.USER_NOT_FOUND]: 404,
        [AuthErrorCode.INVALID_CREDENTIALS]: 400,
        [AuthErrorCode.INVALID_TOKEN_TYPE]: 403,
        [AuthErrorCode.TOKEN_REVOKED]: 401,
    };

    constructor(
        public code: AuthErrorCode,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'AuthError';
        this.code = code;
    }

    get statusCode(): number {
        return AuthError.statusMap[this.code]
    }
}