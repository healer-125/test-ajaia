import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from '../entities/document.entity';
import { DocumentShare } from '../entities/document-share.entity';
import { AccessLevel, ShareRole } from '../entities/share-role.enum';
import { toPublicUser } from '../users/users.service';
import { sanitizeDocumentHtml } from '../common/sanitize';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import {
  Collaborator,
  DocumentDetail,
  DocumentSummary,
} from './document.types';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documents: Repository<DocumentEntity>,
  ) {}

  /**
   * Core access-control primitive. Returns the loaded document together with
   * the caller's access level. Throws NotFound when the document does not
   * exist and Forbidden when it exists but is not shared with the caller.
   */
  async getDocumentWithAccess(
    userId: string,
    documentId: string,
  ): Promise<{ document: DocumentEntity; access: AccessLevel }> {
    const document = await this.documents.findOne({
      where: { id: documentId },
      relations: { owner: true, shares: { user: true } },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const access = this.resolveAccess(userId, document);
    if (access === null) {
      throw new ForbiddenException('You do not have access to this document');
    }
    return { document, access };
  }

  /** Returns 'owner', a share role, or null when the user has no access. */
  resolveAccess(userId: string, document: DocumentEntity): AccessLevel | null {
    if (document.ownerId === userId) {
      return 'owner';
    }
    const share = (document.shares ?? []).find((s) => s.userId === userId);
    return share ? share.role : null;
  }

  private assertCanEdit(access: AccessLevel): void {
    if (access !== 'owner' && access !== ShareRole.EDITOR) {
      throw new ForbiddenException(
        'You only have view access to this document',
      );
    }
  }

  async create(
    ownerId: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentDetail> {
    const entity = this.documents.create({
      ownerId,
      title: dto.title?.trim() || 'Untitled document',
      contentHtml: dto.contentHtml ? sanitizeDocumentHtml(dto.contentHtml) : '',
    });
    const saved = await this.documents.save(entity);
    return this.getDetail(ownerId, saved.id);
  }

  async listForUser(userId: string): Promise<DocumentSummary[]> {
    // Owned documents plus any explicitly shared with the user.
    const rows = await this.documents.find({
      relations: { owner: true, shares: { user: true } },
      order: { updatedAt: 'DESC' },
    });
    return rows
      .map((doc) => {
        const access = this.resolveAccess(userId, doc);
        return access ? this.toSummary(doc, access) : null;
      })
      .filter((x): x is DocumentSummary => x !== null);
  }

  async getDetail(userId: string, documentId: string): Promise<DocumentDetail> {
    const { document, access } = await this.getDocumentWithAccess(
      userId,
      documentId,
    );
    return this.toDetail(document, access);
  }

  async update(
    userId: string,
    documentId: string,
    dto: UpdateDocumentDto,
  ): Promise<DocumentDetail> {
    const { document, access } = await this.getDocumentWithAccess(
      userId,
      documentId,
    );
    this.assertCanEdit(access);

    if (dto.title !== undefined) {
      document.title = dto.title.trim() || 'Untitled document';
    }
    if (dto.contentHtml !== undefined) {
      document.contentHtml = sanitizeDocumentHtml(dto.contentHtml);
    }
    await this.documents.save(document);
    return this.getDetail(userId, documentId);
  }

  async remove(userId: string, documentId: string): Promise<void> {
    const { document, access } = await this.getDocumentWithAccess(
      userId,
      documentId,
    );
    if (access !== 'owner') {
      throw new ForbiddenException('Only the owner can delete this document');
    }
    await this.documents.remove(document);
  }

  private toSummary(
    document: DocumentEntity,
    access: AccessLevel,
  ): DocumentSummary {
    return {
      id: document.id,
      title: document.title,
      access,
      owner: toPublicUser(document.owner),
      updatedAt: document.updatedAt,
      createdAt: document.createdAt,
      sharedCount: document.shares?.length ?? 0,
    };
  }

  private toDetail(
    document: DocumentEntity,
    access: AccessLevel,
  ): DocumentDetail {
    const collaborators: Collaborator[] = (document.shares ?? [])
      .filter((s) => s.user)
      .map((s) => ({ user: toPublicUser(s.user), role: s.role }));
    return {
      ...this.toSummary(document, access),
      contentHtml: document.contentHtml,
      collaborators,
    };
  }
}
