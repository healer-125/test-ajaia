import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentShare } from '../entities/document-share.entity';
import { SharesService } from './shares.service';
import { SharesController } from './shares.controller';
import { DocumentsModule } from '../documents/documents.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentShare]),
    DocumentsModule,
    UsersModule,
  ],
  providers: [SharesService],
  controllers: [SharesController],
})
export class SharesModule {}
