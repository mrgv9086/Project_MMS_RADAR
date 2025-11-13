import { Response } from "express";
import busboy, { Busboy } from 'busboy';
import { FileError, FileErrorCode } from "../error/file_errors";
import FileService from "../service/file_service";
import { AuthRequest } from "../model/http/base_requests";
import { Config } from "../config";
import { createReadStream } from "node:fs";
import { FileFilter, GetFileQuerySchema } from "../model/http/file/requests";

class FileController {
    async uploadFile(req: AuthRequest, res: Response) {

        const storageName = req.params.storageName;

        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes("multipart/form-data")) {
            throw new FileError(
                FileErrorCode.UNSUPPORTED_CONTENT_TYPE,
                "Only multipart/form-data available for file upload"
            )
        }

        const bb: Busboy = busboy({
                headers: req.headers,
                defParamCharset: 'utf-8',
                limits: {
                    fileSize: Config.MAX_FILE_SIZE_BYTES,
                    files: Config.MAX_FILES_PER_REQUEST,
                }
            }
        );
        return res.json(await FileService.uploadFile(storageName, req.user!.id, bb, req));
    }

    async getFiles(req: AuthRequest, res: Response) {
        const storageName = req.params.storageName;
        const validatedBody: FileFilter = GetFileQuerySchema.parse(req.query);
        return res.json(await FileService.getFiles(storageName, req.user!.id, validatedBody));
    }

    async getFile(req: AuthRequest, res: Response) {
        const storageName = req.params.storageName;
        const fileName = req.params.fileName;
        return res.json(await FileService.getFile(storageName, req.user!.id, fileName));
    }

    async downloadFile(req: AuthRequest, res: Response) {
        const storageName = req.params.storageName;
        const fileName = req.params.fileName;
        try {
            const { filePath, fileRecord } = await FileService.downloadFile(storageName, req.user!.id, fileName);

            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileRecord.name)}"`);
            res.setHeader('Content-Length', fileRecord.size.toString());

            const fileStream = createReadStream(filePath);

            fileStream.on('error', (error) => {
                console.error('File stream error:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Error reading file',
                        message: error.message
                    });
                }
            });

            fileStream.pipe(res);

        } catch (error) {
            if (error instanceof FileError) {
                throw error;
            }
            console.error('Download error:', error);
            throw new FileError(
                FileErrorCode.DOWNLOAD_ERROR,
                "Failed to download file",
            );
        }
    }

    async deleteFile(req: AuthRequest, res: Response) {
        const storageName = req.params.storageName;
        const fileName = req.params.fileName;
        await FileService.deleteFile(storageName, req.user!.id, fileName);
        return res.status(204).end();
    }
}

export default new FileController();