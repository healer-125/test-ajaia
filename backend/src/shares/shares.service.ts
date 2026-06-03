import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentShare } from '../entities/document-share.entity';
import { ShareRole } from '../entities/share-role.enum';
import { DocumentsService } from '../documents/documents.service';
import { UsersService, toPublicUser } from '../users/users.service';
import { Collaborator } from '../documents/document.types';

@Injectable()
export class SharesService {
  constructor(
    @InjectRepository(DocumentShare)
    private readonly shares: Repository<DocumentShare>,
    private readonly documents: DocumentsService,
    private readonly users: UsersService,
  ) {}

  private async assertOwner(
    ownerId: string,
    documentId: string,
  ): Promise<void> {
    const { access } = await this.documents.getDocumentWithAccess(
      ownerId,
      documentId,
    );
    if (access !== 'owner') {
      throw new ForbiddenException(
        'Only the document owner can manage sharing',
      );
    }
  }

  async listCollaborators(
    ownerId: string,
    documentId: string,
  ): Promise<Collaborator[]> {
    await this.assertOwner(ownerId, documentId);
    const rows = await this.shares.find({
      where: { documentId },
      relations: { user: true },
    });
    return rows.map((s) => ({ user: toPublicUser(s.user), role: s.role }));
  }

  async grant(
    ownerId: string,
    documentId: string,
    email: string,
    role: ShareRole = ShareRole.VIEWER,
  ): Promise<Collaborator> {
    await this.assertOwner(ownerId, documentId);

    const target = await this.users.findByEmail(email);
    if (!target) {
      throw new NotFoundException(`No user found with email ${email}`);
    }
    if (target.id === ownerId) {
      throw new BadRequestException(
        'You already own this document and cannot share it with yourself',
      );
    }

    // Upsert: re-sharing simply updates the existing role.
    let share = await this.shares.findOne({
      where: { documentId, userId: target.id },
    });
    if (share) {
      share.role = role;
    } else {
      share = this.shares.create({ documentId, userId: target.id, role });
    }
    await this.shares.save(share);

    return { user: toPublicUser(target), role };
  }

  async revoke(
    ownerId: string,
    documentId: string,
    userId: string,
  ): Promise<void> {
    await this.assertOwner(ownerId, documentId);
    const share = await this.shares.findOne({
      where: { documentId, userId },
    });
    if (!share) {
      throw new NotFoundException('This user is not a collaborator');
    }
    await this.shares.remove(share);
  }
}
