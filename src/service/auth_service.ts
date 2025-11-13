import UserRepository from "../repository/user_repository";
import { User } from "@prisma/client";
import { AuthorizationResponse } from "../model/http/auth/responses";
import jwt from "jsonwebtoken";
import { LoginRequest, RegisterRequest } from "../model/http/auth/requests";
import bcrypt from "bcrypt";
import { AuthError, AuthErrorCode } from "../error/auth_errors";
import { Config } from "../config";

class AuthService {

    private generateTokens(user: User): { accessToken: string; refreshToken: string } {
        const accessToken = jwt.sign(
            {id: user.id, username: user.username, type: 'access'},
            Config.SECRET_KEY!,
            Config.ACCESS_TOKEN_CONFIG
        );

        const refreshToken = jwt.sign(
            {id: user.id, type: 'refresh'},
            Config.SECRET_KEY!,
            Config.REFRESH_TOKEN_CONFIG
        );

        return {accessToken, refreshToken};
    }

    async register(body: RegisterRequest): Promise<AuthorizationResponse> {
        const existingUser: User | null = await UserRepository.findByUsername(body.username);
        if (existingUser) {
            throw new AuthError(
                AuthErrorCode.USER_ALREADY_EXISTS,
                'User already exists',
                {username: body.username}
            );
        }

        const hashedPassword = await bcrypt.hash(body.password, 12);
        const user: User = await UserRepository.createUser(body.username, hashedPassword);

        const tokens = this.generateTokens(user);

        await UserRepository.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }

    async login(body: LoginRequest): Promise<AuthorizationResponse> {
        const user: User | null = await UserRepository.findByUsername(body.username);

        if (!user) {
            throw new AuthError(
                AuthErrorCode.USER_NOT_FOUND,
                'User not found',
                {username: body.username}
            );
        }

        const passwordMatch: boolean = await bcrypt.compare(body.password, user.password);
        if (!passwordMatch) {
            throw new AuthError(
                AuthErrorCode.INVALID_CREDENTIALS,
                'Invalid username or password',
            )
        }

        const tokens = this.generateTokens(user);

        await UserRepository.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens
    }

    async refreshTokens(refreshToken: string): Promise<AuthorizationResponse> {

        const decoded = jwt.verify(refreshToken, Config.SECRET_KEY!) as {
            id: string;
            type: string;
        };

        if (decoded.type !== 'refresh') {
            throw new AuthError(
                AuthErrorCode.INVALID_TOKEN_TYPE,
                'Invalid refresh token'
            )
        }

        const user = await UserRepository.findById(Number(decoded.id));
        if (!user) {
            throw new AuthError(
                AuthErrorCode.USER_NOT_FOUND,
                'User not found',
            );
        }

        if (user.refreshToken !== refreshToken) {
            throw new AuthError(
                AuthErrorCode.TOKEN_REVOKED,
                'Refresh token revoked'
            )
        }

        const tokens = this.generateTokens(user);

        await UserRepository.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

}

export default new AuthService;