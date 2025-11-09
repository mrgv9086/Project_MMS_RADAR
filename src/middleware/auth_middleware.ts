import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from "../model/http/base_requests";
import { SECRET_KEY } from "../service/auth_service";

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({message: 'Unauthorized'});
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({message: 'Token verification failed'});
        }

        req.user = decoded as { id: number; username: string };
        next();
    });
}
