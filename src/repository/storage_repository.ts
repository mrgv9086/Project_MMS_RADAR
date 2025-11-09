import { Storage } from "@prisma/client"
import { BaseRepository } from "./base_repository";
import { CreateStorageRequest, StorageFilter } from "../model/http/storage/requests";
import { StorageWithUser } from "../model/http/storage/dto";

class StorageRepository extends BaseRepository {

    async findByUserAndName(userId: number, name: string): Promise<Storage | null> {
        return this.prisma.storage.findFirst({
            where: {created_by: userId, name},
        });
    }

    async createStorage(userId: number, path: string, data: CreateStorageRequest) {
        return this.prisma.storage.create({
            data: {
                name: data.name,
                type: data.type,
                maxsize: BigInt(data.maxsize),
                created_by: userId,
                path: path,
            }
        })
    }

    async getAvailableStorages(userId: number, filter: StorageFilter): Promise<Array<StorageWithUser>> {
        return this.prisma.storage.findMany({
            where: {
                created_by: userId,
                ...(filter.name !== null && {
                    name: {
                        contains: filter.name,
                        mode: 'insensitive'
                    }
                }),
                ...(filter.type !== null && {type: filter.type})
            },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            },
            skip: filter.from - 1,
            take: filter.size,
            orderBy: {
                id: 'asc'
            }
        });
    }

    async deleteStorage(storageId: number) {
        // Исправлено: добавлен await
        await this.prisma.storage.delete({
            where: {
                id: storageId
            }
        })
    }

    async deleteStorageForce(storageId: number) {
        // Исправлено: добавлен await
        await this.prisma.$transaction(async (tx) => {
            await tx.file.deleteMany({
                where: {
                    storage: storageId
                }
            });

            await tx.storage.delete({
                where: {
                    id: storageId
                }
            });
        });
    }
}

export default new StorageRepository;