import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth-user.interface';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentDetail, DocumentSummary } from './document.types';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<DocumentSummary[]> {
    return this.documents.listForUser(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDocumentDto,
  ): Promise<DocumentDetail> {
    return this.documents.create(user.userId, dto);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentDetail> {
    return this.documents.getDetail(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentDetail> {
    return this.documents.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.documents.remove(user.userId, id);
  }
}
