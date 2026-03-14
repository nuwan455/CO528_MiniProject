import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('media')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Media file is required');
    }

    const media = await this.uploadsService.saveMediaFile(file);

    return {
      message: 'Media uploaded successfully',
      data: media,
    };
  }

  @Post('documents')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    const document = await this.uploadsService.saveDocumentFile(file);

    return {
      message: 'Document uploaded successfully',
      data: document,
    };
  }
}
