import { ErrorResponse } from "../model/http/base_responses";
import { Request, Response, NextFunction } from "express";
import { AuthError } from "../error/auth_errors";
import { StorageError } from "../error/storage_errors";

export function errorHandler(
    error: Error,
    req: Request,
    res: Response<ErrorResponse>,
    next: NextFunction
) {
    console.error('Error:', error);

    if (error instanceof AuthError ||
        error instanceof StorageError
    ) {
        return res.status(error.statusCode).json({
            message: error.message,
            code: error.code,
            details: error.details
        });
    }

    return res.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
    });
}