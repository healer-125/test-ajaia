import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
