import {PrismaClient} from "@prisma/client";

export abstract class BaseRepository {
    private static _prisma: PrismaClient | null = null;

    protected get prisma(): PrismaClient {
        if (!BaseRepository._prisma) {
            BaseRepository._prisma = new PrismaClient();
            console.log('✅ Создан PrismaClient');
        }
        return BaseRepository._prisma;
    }
}