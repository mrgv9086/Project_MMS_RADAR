import { Storage } from "@prisma/client";

export interface StorageWithUser extends Storage{
    user: {
        username: string;
    }
}