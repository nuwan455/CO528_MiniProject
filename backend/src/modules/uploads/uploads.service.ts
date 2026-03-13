import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class UploadsService {
  constructor(private readonly config: AppConfigService) {}

  async saveFile(file?: Express.Multer.File): Promise<string | undefined> {
    if (!file) {
      return undefined;
    }

    const extension = extname(file.originalname);
    const fileName = `${randomUUID()}${extension}`;
    const targetDir = join(process.cwd(), this.config.uploadDir);
    await mkdir(targetDir, { recursive: true });
    const targetPath = join(targetDir, fileName);
    await writeFile(targetPath, file.buffer);
    return `/${this.config.uploadDir}/${fileName}`;
  }
}
