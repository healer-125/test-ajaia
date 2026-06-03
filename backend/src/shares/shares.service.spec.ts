import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { SharesService } from './shares.service';
import { DocumentShare } from '../entities/document-share.entity';
import { DocumentsService } from '../documents/documents.service';
import { UsersService } from '../users/users.service';
import { ShareRole } from '../entities/share-role.enum';
import { User } from '../entities/user.entity';

function makeUser(id: string, email: string): User {
  return {
    id,
    email,
    displayName: email,
    passwordHash: 'x',
    createdAt: new Date(),
    documents: [],
    shares: [],
  };
}

describe('SharesService', () => {
  let shares: jest.Mocked<
    Pick<Repository<DocumentShare>, 'find' | 'findOne' | 'create' | 'save' | 'remove'>
  >;
  let documents: { getDocumentWithAccess: jest.Mock };
  let users: { findByEmail: jest.Mock };
  let service: SharesService;

  beforeEach(() => {
    shares = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<
        Repository<DocumentShare>,
        'find' | 'findOne' | 'create' | 'save' | 'remove'
      >
    >;
    documents = { getDocumentWithAccess: jest.fn() };
    users = { findByEmail: jest.fn() };
    service = new SharesService(
      shares as unknown as Repository<DocumentShare>,
      documents as unknown as DocumentsService,
      users as unknown as UsersService,
    );
  });

  it('forbids non-owners from sharing', async () => {
    documents.getDocumentWithAccess.mockResolvedValue({
      access: ShareRole.EDITOR,
      document: {},
    });
    await expect(
      service.grant('editor-1', 'doc-1', 'bob@ajaia.dev', ShareRole.VIEWER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects sharing with an unknown email', async () => {
    documents.getDocumentWithAccess.mockResolvedValue({
      access: 'owner',
      document: {},
    });
    users.findByEmail.mockResolvedValue(null);
    await expect(
      service.grant('owner-1', 'doc-1', 'ghost@ajaia.dev', ShareRole.VIEWER),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects sharing a document with yourself', async () => {
    documents.getDocumentWithAccess.mockResolvedValue({
      access: 'owner',
      document: {},
    });
    users.findByEmail.mockResolvedValue(makeUser('owner-1', 'alice@ajaia.dev'));
    await expect(
      service.grant('owner-1', 'doc-1', 'alice@ajaia.dev', ShareRole.VIEWER),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('grants a new editor share for the owner', async () => {
    documents.getDocumentWithAccess.mockResolvedValue({
      access: 'owner',
      document: {},
    });
    users.findByEmail.mockResolvedValue(makeUser('bob-1', 'bob@ajaia.dev'));
    shares.findOne.mockResolvedValue(null);
    shares.save.mockResolvedValue({} as DocumentShare);

    const result = await service.grant(
      'owner-1',
      'doc-1',
      'bob@ajaia.dev',
      ShareRole.EDITOR,
    );

    expect(shares.save).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'doc-1',
        userId: 'bob-1',
        role: ShareRole.EDITOR,
      }),
    );
    expect(result).toEqual({
      user: { id: 'bob-1', email: 'bob@ajaia.dev', displayName: 'bob@ajaia.dev' },
      role: ShareRole.EDITOR,
    });
  });

  it('updates the role when re-sharing with an existing collaborator', async () => {
    documents.getDocumentWithAccess.mockResolvedValue({
      access: 'owner',
      document: {},
    });
    users.findByEmail.mockResolvedValue(makeUser('bob-1', 'bob@ajaia.dev'));
    const existing = {
      id: 's1',
      documentId: 'doc-1',
      userId: 'bob-1',
      role: ShareRole.VIEWER,
    } as DocumentShare;
    shares.findOne.mockResolvedValue(existing);
    shares.save.mockResolvedValue(existing);

    await service.grant('owner-1', 'doc-1', 'bob@ajaia.dev', ShareRole.EDITOR);

    expect(existing.role).toBe(ShareRole.EDITOR);
    expect(shares.create).not.toHaveBeenCalled();
  });

  it('revokes an existing collaborator', async () => {
    documents.getDocumentWithAccess.mockResolvedValue({
      access: 'owner',
      document: {},
    });
    const existing = { id: 's1' } as DocumentShare;
    shares.findOne.mockResolvedValue(existing);

    await service.revoke('owner-1', 'doc-1', 'bob-1');
    expect(shares.remove).toHaveBeenCalledWith(existing);
  });

  it('throws when revoking a non-collaborator', async () => {
    documents.getDocumentWithAccess.mockResolvedValue({
      access: 'owner',
      document: {},
    });
    shares.findOne.mockResolvedValue(null);
    await expect(
      service.revoke('owner-1', 'doc-1', 'nobody'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
