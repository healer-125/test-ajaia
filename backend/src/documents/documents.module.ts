import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from '../entities/document.entity';
import { DocumentShare } from '../entities/document-share.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity, DocumentShare])],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
