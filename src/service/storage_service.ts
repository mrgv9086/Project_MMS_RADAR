import { CreateStorageRequest, DeleteStorageRequest, StorageFilter } from "../model/http/storage/requests";
import { Storage, StorageType } from "@prisma/client";
import StorageRepository from "../repository/storage_repository"
import UserRepository from "../repository/user_repository"
import FileRepository from "../repository/file_repository"
import path from 'path';
import fs from 'fs/promises';
import { StorageResponse } from "../model/http/storage/responses";
import { StorageWithUser } from "../model/http/storage/dto";
import { StorageError, StorageErrorCode } from "../error/storage_errors";


class StorageService {

    static readonly STORAGE_BASE_PATH = (() => {
        const path = process.env.STORAGE_BASE_PATH;
        if (!path) throw Error("Provide STORAGE_BASE_PATH in environment variables");
        return path;
    })();

    async createStorage(body: CreateStorageRequest, userId: number): Promise<StorageResponse> {

        const cleanName = this.sanitizeName(body.name)
        const storage: Storage | null = await StorageRepository.findByUserAndName(userId, cleanName)

        if (storage) {
            throw new Error("Storage already exists");
        }

        const prefixPath: string = body.type === StorageType.private
            ? `users/${userId}/private/${cleanName}`
            : `users/${userId}/shared/${cleanName}`;

        const fullPath = path.join(StorageService.STORAGE_BASE_PATH, prefixPath);
        await fs.mkdir(fullPath, {recursive: true});

        const newStorage: Storage = await StorageRepository.createStorage(userId, fullPath, body);
        return {
            name: newStorage.name,
            maxsize: newStorage.maxsize.toString(),
            type: newStorage.type,
            created_by: (await UserRepository.findById(userId))?.username || 'Unknown',
        };
    }

    async getAvailableStorages(filter: StorageFilter, userId: number): Promise<Array<StorageResponse>> {
        const storages: Array<StorageWithUser> = await StorageRepository.getAvailableStorages(userId, filter)

        return storages.map(storage => ({
            name: storage.name,
            maxsize: storage.maxsize.toString(),
            type: storage.type,
            created_by: storage.user.username
        }));
    }

    async deleteStorage(validatedBody: DeleteStorageRequest, userId: number) {

        const storage: Storage | null = await StorageRepository.findByUserAndName(userId, validatedBody.name);

        if (!storage) {
            throw new StorageError(
                StorageErrorCode.STORAGE_NOT_FOUND,
                `Storage with name ${validatedBody.name} not found for user with id ${userId}`,
                'Storage not found or access denied'
            );
        }

        if (!validatedBody.force) {
            const count = await FileRepository.getFilesCountByStorageId(storage.id);

            if (count !== 0) {
                throw new StorageError(
                    StorageErrorCode.STORAGE_NOT_EMPTY,
                    "Storage still contains files",
                    "Use force=true if you want delete not empty storage"
                )
            }

            await StorageRepository.deleteStorage(storage.id);
            await fs.rm(storage.path, { recursive: true })
            return;
        }

        await StorageRepository.deleteStorageForce(storage.id);
        await fs.rm(storage.path, { recursive: true })

    }

    private sanitizeName(name: string): string {
        // Проверяем длину
        if (name.length > 30) {
            throw new Error('Storage name must be no more than 30 characters long');
        }

        // Проверяем разрешенные символы
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            throw new Error('Storage name can only contain Latin letters, numbers, underscores and hyphens');
        }

        // Проверяем, что имя не пустое после трима
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            throw new Error('Storage name cannot be empty');
        }

        // Проверяем, что имя не состоит только из специальных символов
        if (!/[a-zA-Z0-9]/.test(trimmedName)) {
            throw new Error('Storage name must contain at least one letter or number');
        }

        return trimmedName;
    }
}

export default new StorageService;