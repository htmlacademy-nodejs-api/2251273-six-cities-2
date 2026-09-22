import { NextFunction, Request, Response } from 'express';
import multer, { diskStorage } from 'multer';
import { extension } from 'mime-types';
import { nanoid } from 'nanoid';
import { mkdirSync } from 'node:fs';
import { StatusCodes } from 'http-status-codes';
import { MiddlewareInterface } from './middleware.interface.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

export class FileMiddleware implements MiddlewareInterface {
  constructor(
    private readonly uploadDirectory: string,
    private readonly fieldName: string = 'avatar',
    private readonly maxFileSize: number = 1024 * 1024,
  ) {
    mkdirSync(this.uploadDirectory, { recursive: true });
  }

  public execute(req: Request, res: Response, next: NextFunction): void {
    const storage = diskStorage({
      destination: this.uploadDirectory,
      filename: (_req, file, callback) => {
        const fileExtension = extension(file.mimetype) || 'bin';
        const uniqueName = nanoid(10);
        callback(null, `${uniqueName}.${fileExtension}`);
      },
    });

    const upload = multer({
      storage,
      limits: { fileSize: this.maxFileSize },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(new Error('Only .jpg and .png files are allowed'));
          return;
        }
        callback(null, true);
      },
    }).single(this.fieldName);

    upload(req, res, (err) => {
      if (err) {
        if (err.message.includes('Only .jpg')) {
          res.status(StatusCodes.BAD_REQUEST).json({
            statusCode: StatusCodes.BAD_REQUEST,
            message: err.message,
          });
          return;
        }
        return next(err);
      }
      next();
    });
  }
}
