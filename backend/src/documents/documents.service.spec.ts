import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DocumentsService } from './documents.service';
import { DocumentEntity } from '../entities/document.entity';
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

function makeDocument(overrides: Partial<DocumentEntity> = {}): DocumentEntity {
  const owner = makeUser('owner-1', 'alice@ajaia.dev');
  return {
    id: 'doc-1',
    title: 'Doc',
    contentHtml: '<p>hi</p>',
    ownerId: owner.id,
    owner,
    shares: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('DocumentsService access control', () => {
  let repo: jest.Mocked<Pick<Repository<DocumentEntity>, 'findOne' | 'save'>>;
  let service: DocumentsService;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<Repository<DocumentEntity>, 'findOne' | 'save'>
    >;
    service = new DocumentsService(repo as unknown as Repository<DocumentEntity>);
  });

  describe('resolveAccess', () => {
    it('returns "owner" for the document owner', () => {
      const doc = makeDocument();
      expect(service.resolveAccess('owner-1', doc)).toBe('owner');
    });

    it('returns the share role for a collaborator', () => {
      const bob = makeUser('bob-1', 'bob@ajaia.dev');
      const doc = makeDocument({
        shares: [
          {
            id: 's1',
            documentId: 'doc-1',
            userId: 'bob-1',
            user: bob,
            role: ShareRole.VIEWER,
            document: {} as DocumentEntity,
            createdAt: new Date(),
          },
        ],
      });
      expect(service.resolveAccess('bob-1', doc)).toBe(ShareRole.VIEWER);
    });

    it('returns null when the user has no access', () => {
      const doc = makeDocument();
      expect(service.resolveAccess('stranger', doc)).toBeNull();
    });
  });

  describe('getDocumentWithAccess', () => {
    it('throws NotFound when the document does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.getDocumentWithAccess('owner-1', 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when the document exists but is not shared', async () => {
      repo.findOne.mockResolvedValue(makeDocument());
      await expect(
        service.getDocumentWithAccess('stranger', 'doc-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('update', () => {
    it('rejects edits from a viewer', async () => {
      const bob = makeUser('bob-1', 'bob@ajaia.dev');
      repo.findOne.mockResolvedValue(
        makeDocument({
          shares: [
            {
              id: 's1',
              documentId: 'doc-1',
              userId: 'bob-1',
              user: bob,
              role: ShareRole.VIEWER,
              document: {} as DocumentEntity,
              createdAt: new Date(),
            },
          ],
        }),
      );
      await expect(
        service.update('bob-1', 'doc-1', { title: 'Hacked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('allows an editor to update and sanitizes content', async () => {
      const bob = makeUser('bob-1', 'bob@ajaia.dev');
      repo.findOne.mockResolvedValue(
        makeDocument({
          shares: [
            {
              id: 's1',
              documentId: 'doc-1',
              userId: 'bob-1',
              user: bob,
              role: ShareRole.EDITOR,
              document: {} as DocumentEntity,
              createdAt: new Date(),
            },
          ],
        }),
      );
      repo.save.mockResolvedValue({} as DocumentEntity);

      const result = await service.update('bob-1', 'doc-1', {
        contentHtml: '<p>safe</p><script>alert(1)</script>',
      });

      expect(repo.save).toHaveBeenCalledTimes(1);
      const saved = repo.save.mock.calls[0][0] as DocumentEntity;
      expect(saved.contentHtml).toBe('<p>safe</p>');
      expect(result.contentHtml).not.toContain('<script>');
    });
  });
});
