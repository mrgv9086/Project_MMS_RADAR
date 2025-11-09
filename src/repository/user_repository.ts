import { User } from "@prisma/client";
import { BaseRepository } from "./base_repository";

class UserRepository extends BaseRepository {

    async findById(id: number): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { id }
        })
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { username }
        })
    }

    async createUser(username: string, password: string): Promise<User> {
        return this.prisma.user.create({
            data: {
                username,
                password
            }
        })
    }

    async updateRefreshToken(id: number, refreshToken: string) {
        await this.prisma.user.update({
            data: { refreshToken },
            where: { id }
        })
    }
}

export default new UserRepository;