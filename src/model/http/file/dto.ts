import { File } from "@prisma/client";

export interface FileWithUser extends File {
    user: {
        username: string;
    }
}