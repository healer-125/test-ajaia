import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { DocumentEntity } from '../entities/document.entity';
import { DocumentShare } from '../entities/document-share.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, DocumentEntity, DocumentShare])],
  providers: [UsersService, SeedService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
