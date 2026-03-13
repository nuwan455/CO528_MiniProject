import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AppConfigModule],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
