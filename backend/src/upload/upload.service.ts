import { BadRequestException, Injectable } from '@nestjs/common';
import { marked } from 'marked';
import * as mammoth from 'mammoth';
import { DocumentsService } from '../documents/documents.service';
import { DocumentDetail } from '../documents/document.types';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.docx'] as const;

@Injectable()
export class UploadService {
  constructor(private readonly documents: DocumentsService) {}

  async importDocument(
    ownerId: string,
    file: Express.Multer.File,
  ): Promise<DocumentDetail> {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File exceeds the 5 MB upload limit');
    }

    const ext = this.extensionOf(file.originalname);
    const html = await this.convert(ext, file);
    const title = this.titleFromFilename(file.originalname);

    // create() sanitizes the HTML before persisting.
    return this.documents.create(ownerId, { title, contentHtml: html });
  }

  private async convert(
    ext: string,
    file: Express.Multer.File,
  ): Promise<string> {
    switch (ext) {
      case '.txt':
        return this.textToHtml(file.buffer.toString('utf8'));
      case '.md':
        return (await marked.parse(file.buffer.toString('utf8'))) as string;
      case '.docx': {
        const result = await mammoth.convertToHtml({ buffer: file.buffer });
        return result.value || '<p></p>';
      }
      default:
        throw new BadRequestException(
          `Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        );
    }
  }

  private textToHtml(text: string): string {
    const escape = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const paragraphs = text
      .split(/\r?\n\r?\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => `<p>${escape(block).replace(/\r?\n/g, '<br>')}</p>`);
    return paragraphs.join('') || '<p></p>';
  }

  private extensionOf(filename: string): string {
    const match = /\.[^.]+$/.exec(filename || '');
    return match ? match[0].toLowerCase() : '';
  }

  private titleFromFilename(filename: string): string {
    const base = (filename || 'Imported document').replace(/\.[^.]+$/, '');
    return base.trim() || 'Imported document';
  }
}
