import { SignOptions } from "jsonwebtoken";
import { StringValue } from "ms";
import dotenv from 'dotenv';
import path from "path";

dotenv.config({
    path: path.resolve(process.cwd(), "../", '.env')
});


export class Config {
    static readonly STORAGE_BASE_PATH = (() => {
        const path = process.env.STORAGE_BASE_PATH;
        if (!path) throw Error("Provide STORAGE_BASE_PATH in environment variables");
        return path;
    })();

    static readonly ACCESS_TOKEN_CONFIG: SignOptions = {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN || '15m') as StringValue,
        issuer: process.env.JWT_ISUER || 'web-archive'
    };

    static readonly REFRESH_TOKEN_CONFIG: SignOptions = {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '1h') as StringValue,
        issuer: process.env.JWT_ISUER || 'web-archive'
    }

    static readonly SECRET_KEY = (() => {
        const key = process.env.SECRET_KEY;
        if (!key) throw new Error("Provide SECRET_KEY in environment variables");
        return key;
    })();

    static readonly MAX_FILES_PER_REQUEST = Number(process.env.MAX_FILES_PER_REQUEST) || 5;
    static readonly MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_BYTES) || 100 * 1024 * 1024;
}