import { ErrorResponse } from "../model/http/base_responses";
import { Request, Response, NextFunction } from "express";
import { BaseError } from "../error/base/base_error";

export function errorHandler(
    error: Error,
    req: Request,
    res: Response<ErrorResponse>,
    next: NextFunction
) {
    console.error('Error:', error);

    if (error instanceof BaseError
    ) {
        return res.status(error.statusCode).json(error.toJSON());
    }

    return res.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
    });
}