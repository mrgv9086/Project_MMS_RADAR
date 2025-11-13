import { BaseError } from "./base/base_error";

export enum AuthErrorCode {
    USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    INVALID_TOKEN_TYPE = "INVALID_TOKEN_TYPE",
    TOKEN_REVOKED = 'TOKEN_REVOKED',
}
export class AuthError extends BaseError {
    readonly statusMap: Record<AuthErrorCode, number> = {
        [AuthErrorCode.USER_ALREADY_EXISTS]: 400,
        [AuthErrorCode.USER_NOT_FOUND]: 404,
        [AuthErrorCode.INVALID_CREDENTIALS]: 400,
        [AuthErrorCode.INVALID_TOKEN_TYPE]: 403,
        [AuthErrorCode.TOKEN_REVOKED]: 401,
    };

    constructor(code: AuthErrorCode, message: string, details?: any) {
        super(code, message, details);
    }
}