import { Response } from 'express';
import { StorageResponse } from "../model/http/storage/responses";
import StorageService from "../service/storage_service";
import { AuthRequest } from "../model/http/base_requests";
import {
    StorageFilter,
    GetStoragesQuerySchema,
    DeleteStorageRequest,
    DeleteStorageBodySchema,
} from "../model/http/storage/requests";

class StorageController {
    async createStorage(req: AuthRequest, res: Response<StorageResponse>) {
        return res.json(await StorageService.createStorage(req.body, req.user!.id))
    }

    async getAvailableStorages(req: AuthRequest, res: Response<Array<StorageResponse>>) {

        const validatedQuery: StorageFilter = GetStoragesQuerySchema.parse(req.query);
        return res.json(await StorageService.getAvailableStorages(validatedQuery, req.user!.id));
    }

    async getStorage(req: AuthRequest, res: Response<StorageResponse>) {

    }

    async deleteStorage(req: AuthRequest, res: Response<StorageResponse>) {
        const validatedBody: DeleteStorageRequest = DeleteStorageBodySchema.parse(req.body);
        await StorageService.deleteStorage(validatedBody, req.user!.id);
        return res.status(204).end();
    }
}

export default new StorageController();