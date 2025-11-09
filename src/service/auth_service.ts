import UserRepository from "../repository/user_repository";
import { User } from "@prisma/client";
import { AuthorizationResponse } from "../model/http/auth/responses";
import jwt, { SignOptions } from "jsonwebtoken";
import { StringValue } from "ms";
import { LoginRequest, RegisterRequest } from "../model/http/auth/requests";
import bcrypt from "bcrypt";
import { AuthError, AuthErrorCode } from "../error/auth_errors";

class AuthService {

    static readonly SECRET_KEY = (() => {
        const key = process.env.SECRET_KEY;
        if (!key) throw new Error("Provide SECRET_KEY in environment variables");
        return key;
    })();

    private static readonly ACCESS_TOKEN_CONFIG: SignOptions = {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN || '15m') as StringValue,
        issuer: process.env.JWT_ISUER || 'web-archive'
    };

    private static readonly REFRESH_TOKEN_CONFIG: SignOptions = {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '1h') as StringValue,
        issuer: process.env.JWT_ISUER || 'web-archive'
    }

    private generateTokens(user: User): { accessToken: string; refreshToken: string } {
        const accessToken = jwt.sign(
            {id: user.id, username: user.username, type: 'access'},
            AuthService.SECRET_KEY!,
            AuthService.ACCESS_TOKEN_CONFIG
        );

        const refreshToken = jwt.sign(
            {id: user.id, type: 'refresh'},
            AuthService.SECRET_KEY!,
            AuthService.REFRESH_TOKEN_CONFIG
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

        const decoded = jwt.verify(refreshToken, AuthService.SECRET_KEY!) as {
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
export const SECRET_KEY = AuthService.SECRET_KEY;