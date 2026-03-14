import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { AppConfigService } from '../../config/app-config.service';

export interface UploadedMedia {
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
}

export interface UploadedDocument {
  documentUrl: string;
  fileName: string;
}

@Injectable()
export class UploadsService {
  constructor(private readonly config: AppConfigService) {}

  async saveMediaFile(file?: Express.Multer.File): Promise<UploadedMedia | undefined> {
    if (!file) {
      return undefined;
    }

    if (file.size > this.config.maxFileSize) {
      throw new PayloadTooLargeException(
        `File exceeds the ${this.config.maxFileSize} byte limit`,
      );
    }

    const mediaType = this.resolveMediaType(file.mimetype);
    const extension = extname(file.originalname);
    const fileName = `${randomUUID()}${extension}`;
    const targetDir = join(process.cwd(), this.config.uploadDir);
    await mkdir(targetDir, { recursive: true });
    const targetPath = join(targetDir, fileName);
    await writeFile(targetPath, file.buffer);

    return {
      mediaType,
      mediaUrl: `/${this.config.uploadDir}/${fileName}`,
    };
  }

  async saveDocumentFile(file?: Express.Multer.File): Promise<UploadedDocument | undefined> {
    if (!file) {
      return undefined;
    }

    if (file.size > this.config.maxFileSize) {
      throw new PayloadTooLargeException(
        `File exceeds the ${this.config.maxFileSize} byte limit`,
      );
    }

    this.ensureDocumentMimeType(file.mimetype);

    const extension = extname(file.originalname);
    const fileName = `${randomUUID()}${extension}`;
    const targetDir = join(process.cwd(), this.config.uploadDir);
    await mkdir(targetDir, { recursive: true });
    const targetPath = join(targetDir, fileName);
    await writeFile(targetPath, file.buffer);

    return {
      documentUrl: `/${this.config.uploadDir}/${fileName}`,
      fileName: file.originalname,
    };
  }

  private resolveMediaType(mimeType?: string): 'IMAGE' | 'VIDEO' {
    if (!mimeType) {
      throw new BadRequestException('Unsupported media type');
    }

    if (mimeType.startsWith('image/')) {
      return 'IMAGE';
    }

    if (mimeType.startsWith('video/')) {
      return 'VIDEO';
    }

    throw new BadRequestException('Only image and video uploads are supported');
  }

  private ensureDocumentMimeType(mimeType?: string): void {
    if (!mimeType) {
      throw new BadRequestException('Unsupported document type');
    }

    const allowedPrefixes = ['application/', 'text/'];
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      allowedPrefixes.some((prefix) => mimeType.startsWith(prefix)) ||
      allowedMimeTypes.includes(mimeType)
    ) {
      return;
    }

    throw new BadRequestException('Only document uploads are supported');
  }
}
