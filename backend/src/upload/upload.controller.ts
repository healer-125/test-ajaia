import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth-user.interface';
import {
  MAX_UPLOAD_BYTES,
  SUPPORTED_EXTENSIONS,
  UploadService,
} from './upload.service';
import { DocumentDetail } from '../documents/document.types';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  // Accepts a single file under the "file" field and turns it into a new
  // editable document owned by the caller.
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        const ok = SUPPORTED_EXTENSIONS.some((ext) =>
          file.originalname.toLowerCase().endsWith(ext),
        );
        if (!ok) {
          return cb(
            new BadRequestException(
              `Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  import(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentDetail> {
    return this.upload.importDocument(user.userId, file);
  }
}
