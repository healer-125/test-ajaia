import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth-user.interface';
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';
import { Collaborator } from '../documents/document.types';
import { ShareRole } from '../entities/share-role.enum';

@Controller('documents/:id/shares')
@UseGuards(JwtAuthGuard)
export class SharesController {
  constructor(private readonly shares: SharesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) documentId: string,
  ): Promise<Collaborator[]> {
    return this.shares.listCollaborators(user.userId, documentId);
  }

  @Post()
  grant(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() dto: CreateShareDto,
  ): Promise<Collaborator> {
    return this.shares.grant(
      user.userId,
      documentId,
      dto.email,
      dto.role ?? ShareRole.VIEWER,
    );
  }

  @Delete(':userId')
  @HttpCode(204)
  async revoke(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) documentId: string,
    @Param('userId', ParseUUIDPipe) collaboratorId: string,
  ): Promise<void> {
    await this.shares.revoke(user.userId, documentId, collaboratorId);
  }
}
