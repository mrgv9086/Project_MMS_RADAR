import { Request, Response } from 'express';
import { AuthorizationResponse } from "../model/http/auth/responses";
import { ErrorResponse } from "../model/http/base_responses";
import AuthService from "../service/auth_service";


class AuthController {

    async register(req: Request, res: Response<AuthorizationResponse | ErrorResponse>) {
        return res.json(await AuthService.register(req.body));
    }

    async login(req: Request, res: Response<AuthorizationResponse>) {
        return res.json(await AuthService.login(req.body));
    }

    async refresh(req: Request, res: Response<AuthorizationResponse>) {
        return res.json(await AuthService.refreshTokens(req.body.refreshToken));
    }
}

export default new AuthController;
