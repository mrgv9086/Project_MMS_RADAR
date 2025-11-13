import { BaseRepository } from "./base/base_repository";
import { File } from "@prisma/client"
import { FileWithUser } from "../model/http/file/dto";
import { FileFilter } from "../model/http/file/requests";

class FileRepository extends BaseRepository {

    async getFilesCountByStorageId(storageId: number): Promise<number> {
        return this.prisma.file.count({
            where: {
                storage: storageId
            }
        });
    }

    async findByStorageAndName(storageId: number, filename: string): Promise<FileWithUser | null> {
        return this.prisma.file.findFirst({
            where: {
                storage: storageId,
                name: filename
            },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            },
        })
    }

    async createFile(filename: any, size: bigint, userId: number, storageId: number): Promise<File> {
        return this.prisma.file.create({
            data: {
                name: filename,
                storage: storageId,
                size: size,
                created_by: userId
            }
        })
    }

    async deleteFile(fileId: number) {
        return this.prisma.file.delete({
            where: {
                id: fileId
            }
        });
    }

    async updateFileSize(fileId: number, size: bigint) {
        await this.prisma.file.update({
            data: {
                size: size
            },
            where: {
                id: fileId
            }
        });
    }

    async getFilesByFilter(storageId: number, filter: FileFilter): Promise<Array<FileWithUser>> {
        return this.prisma.file.findMany({
            where: {
                storage: storageId,
                ...(filter.name !== null && {
                    name: {
                        contains: filter.name,
                        mode: 'insensitive'
                    }
                })
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
                name: 'asc'
            }
        });
    }
}

export default new FileRepository();