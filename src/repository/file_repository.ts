import { BaseRepository } from "./base_repository";

class FileRepository extends BaseRepository {

    async getFilesCountByStorageId(storageId: number): Promise<number> {
        return this.prisma.file.count({
            where: {
                storage: storageId
            }
        });
    }

}

export default new FileRepository();