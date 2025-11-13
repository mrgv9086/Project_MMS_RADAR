import { Busboy } from "busboy";
import { createWriteStream } from "fs";
import path from 'path';
import { StorageError, StorageErrorCode } from "../error/storage_errors";
import StorageRepository from "../repository/storage_repository";
import FileRepository from "../repository/file_repository";
import { AuthRequest } from "../model/http/base_requests";
import fs from "fs/promises";
import { Config } from "../config";
import { Storage, File } from "@prisma/client";
import { FileError, FileErrorCode } from "../error/file_errors";
import { FileResponse } from "../model/http/file/responses";
import { FileWithUser } from "../model/http/file/dto";
import { FileFilter } from "../model/http/file/requests";

interface UploadResult {
    success: boolean;
    filename: string;
    size: string;
    error?: string;
}

class FileService {

    async uploadFile(storageName: string, userId: number, bb: Busboy, req: AuthRequest): Promise<UploadResult[]> {

        const result: UploadResult[] = []

        const storage: Storage = await this.getStorageValidated(userId, storageName);
        const fileProcessingPromises: Promise<void>[] = [];

        return new Promise((resolve, reject) => {
            bb.on('file', async (fieldname, file, info) => {
                const {filename, encoding, mimeType} = info;

                if (!filename) {
                    file.resume();
                    result.push({
                        success: false,
                        filename: 'unknown',
                        size: '0',
                        error: 'No filename provided'
                    });
                    return;
                }

                const filePromise = new Promise<void>(async (resolveFile, rejectFile) => {

                    const fileRecord = await FileRepository.createFile(filename, BigInt('0'), userId, storage.id).catch(error => {
                        if (error.code === "P2002") {
                            result.push({
                                success: false,
                                filename: filename,
                                size: 'unknown',
                                error: 'already exists'
                            })
                            return;
                        } else {
                            rejectFile();
                        }
                    })
                    if (!fileRecord) {
                        file.resume();
                        resolveFile();
                        return;
                    }

                    const filePath = path.join(storage.path, filename);
                    console.log('file created')

                    const writeStream = createWriteStream(filePath);

                    let bytesWritten = 0;

                    file.on('data', (chunk) => {
                        bytesWritten += chunk.length;
                        console.log("File: ", filename, "bytesWritten=", bytesWritten)
                    });

                    writeStream.on('finish', async () => {

                        if (file.truncated === true) {
                            result.push({
                                success: false,
                                filename: filename,
                                size: "0",
                                error: "File size limit reached, actual limit: " + Config.MAX_FILE_SIZE_BYTES + "bytes"
                            });

                            await this.cleanupFile(fileRecord.id, filePath);
                            resolveFile();
                            return;
                        }

                        try {
                            const stats = await fs.stat(filePath);
                            const fileSize = stats.size;

                            await FileRepository.updateFileSize(fileRecord.id, BigInt(fileSize));

                            result.push({
                                success: true,
                                filename: filename,
                                size: fileSize.toString()
                            });
                            console.log('File uploaded successfully:', filename, fileSize);
                            resolveFile();
                        } catch (error) {
                            console.error('Error finalizing file:', error);
                            result.push({
                                success: false,
                                filename,
                                size: bytesWritten.toString(),
                                error: `Finalization error: ${error instanceof Error ? error.message : 'Unknown error'}`
                            });
                            rejectFile(error);
                            await this.cleanupFile(fileRecord.id, filePath);
                        }
                    });

                    // Обработка ошибок записи
                    writeStream.on('error', async (error) => {
                        console.error('Write stream error:', error);
                        result.push({
                            success: false,
                            filename,
                            size: bytesWritten.toString(),
                            error: `Write error: ${error.message}`
                        });
                        rejectFile(error);
                        await this.cleanupFile(fileRecord.id, filePath);
                    });

                    file.on('error', async  (error) => {
                        console.error('File stream error:', error);
                        result.push({
                            success: false,
                            filename,
                            size: bytesWritten.toString(),
                            error: `File stream error: ${error.message}`
                        });
                        rejectFile(error);
                        await this.cleanupFile(fileRecord.id, filePath);
                    });

                    file.pipe(writeStream);
                }).catch(
                    (error) => {
                        console.log("Ошибка");
                    }
                );
                fileProcessingPromises.push(filePromise);
            });

            bb.on('filesLimit', async() => {
                try {
                    await Promise.all(fileProcessingPromises);
                    console.log("files limit processed completely");
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            bb.on('close', async () => {
                console.log("bb close")
                try {
                    await Promise.all(fileProcessingPromises);
                    console.log("All files processed completely");
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            })

            bb.on('error', reject);

            req.pipe(bb)
        })
    }

    async cleanupFile(fileId: number, path: string): Promise<void> {
        await FileRepository.deleteFile(fileId)
        await fs.rm(path, {force: true})
    }

    async getStorageValidated(userId: number, storageName: string) {
        const storage = await StorageRepository.findByUserAndName(userId, storageName);
        if (!storage) {
            throw new StorageError(
                StorageErrorCode.STORAGE_NOT_FOUND,
                `Storage '${storageName}' not found for user ${userId}`
            );
        }
        return storage;
    }

    async deleteFile(storageName: string, userId: number, fileName: string) {
        const storage: Storage = await this.getStorageValidated(userId, storageName);
        const file: FileWithUser | null = await FileRepository.findByStorageAndName(storage.id, fileName);
        if (!file) {
            throw new FileError(
                FileErrorCode.FILE_NOT_FOUND,
                "File not found",
                `File with name='${fileName}' not found in storage with name=${storageName}`
            )
        }
        await this.cleanupFile(file.id, path.join(storage.path, file.name));
    }

    async getFile(storageName: string, userId: number, fileName: string): Promise<FileResponse> {
        const storage: Storage = await this.getStorageValidated(userId, storageName);
        const file: FileWithUser | null = await FileRepository.findByStorageAndName(storage.id, fileName);
        if (!file) {
            throw new FileError(
                FileErrorCode.FILE_NOT_FOUND,
                "File not found",
                `File with name='${fileName}' not found in storage with name=${storageName}`
            )
        }
        return {id: file.id, name: file.name, size: file.size.toString(), createdBy: file.user.username }
    }

    async getFiles(storageName: string, userId: number, filter: FileFilter): Promise<Array<FileResponse>> {
        const storage: Storage = await this.getStorageValidated(userId, storageName);
        const files: Array<FileWithUser> = await FileRepository.getFilesByFilter(storage.id, filter)

        return files.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size.toString(),
            createdBy: file.user.username
        }));
    }

    async downloadFile(storageName: string, userId: number, fileName: string): Promise<{ filePath: string; fileRecord: File }> {
        const storage: Storage = await this.getStorageValidated(userId, storageName);
        const file: FileWithUser | null = await FileRepository.findByStorageAndName(storage.id, fileName);

        if (!file) {
            throw new FileError(
                FileErrorCode.FILE_NOT_FOUND,
                "File not found",
                `File with name='${fileName}' not found in storage with name=${storageName}`
            );
        }

        const filePath = path.join(storage.path, fileName);

        try {
            await fs.access(filePath);
        } catch (error) {
            throw new FileError(
                FileErrorCode.FILE_NOT_FOUND,
                "File not found on disk",
                `File '${fileName}' not found at path: ${filePath}`
            );
        }

        return {
            filePath,
            fileRecord: file
        };
    }
}

export default new FileService();
