import { StorageType } from "@prisma/client";

export interface StorageResponse {
    name: string;
    maxsize: string;
    type: StorageType;
    created_by: string;
}