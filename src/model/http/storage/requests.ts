import { StorageType } from "@prisma/client";
import { z } from "zod";

export const GetStoragesQuerySchema = z.object({
    name: z.string().optional().transform(val => val || null),
    type: z.string().optional()
        .transform(val => val as StorageType || null)
        .refine(val => val === null || Object.values(StorageType).includes(val), {
            message: "Invalid storage type"
        }),
    size: z.string().transform(Number).pipe(z.number().min(1).max(100)).default(10),
    from: z.string().transform(Number).pipe(z.number().min(1)).default(1)
})

export type StorageFilter = z.infer<typeof GetStoragesQuerySchema>;

export const DeleteStorageBodySchema = z.object({
    name: z.string(),
    force: z.boolean().optional().transform(Boolean).default(false),
})

export type DeleteStorageRequest = z.infer<typeof DeleteStorageBodySchema>;

export interface CreateStorageRequest {
    name: string;
    maxsize: string;
    type: StorageType;
}