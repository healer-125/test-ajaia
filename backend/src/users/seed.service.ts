import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { DocumentEntity } from '../entities/document.entity';
import { DocumentShare } from '../entities/document-share.entity';
import { ShareRole } from '../entities/share-role.enum';
import { AppConfig } from '../config/configuration';

interface SeedUser {
  email: string;
  displayName: string;
}

const SEED_USERS: SeedUser[] = [
  { email: 'alice@ajaia.dev', displayName: 'Alice Owner' },
  { email: 'bob@ajaia.dev', displayName: 'Bob Collaborator' },
  { email: 'carol@ajaia.dev', displayName: 'Carol Reviewer' },
];

/**
 * Idempotently seeds demo accounts (and one shared sample document) so reviewers
 * can immediately exercise the sharing flow without any manual setup.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(DocumentEntity)
    private readonly documents: Repository<DocumentEntity>,
    @InjectRepository(DocumentShare)
    private readonly shares: Repository<DocumentShare>,
    private readonly config: ConfigService,
    @InjectPinoLogger(SeedService.name) private readonly logger: PinoLogger,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.users.count();
    if (existing > 0) {
      this.logger.info({ users: existing }, 'Seed skipped; users already present');
      return;
    }

    const app = this.config.get<AppConfig>('app')!;
    const passwordHash = await bcrypt.hash(app.seedPassword, 10);

    const created = await this.users.save(
      SEED_USERS.map((u) => this.users.create({ ...u, passwordHash })),
    );
    const byEmail = new Map(created.map((u) => [u.email, u]));
    const alice = byEmail.get('alice@ajaia.dev')!;
    const bob = byEmail.get('bob@ajaia.dev')!;

    const welcome = await this.documents.save(
      this.documents.create({
        title: 'Welcome to Ajaia Docs',
        ownerId: alice.id,
        contentHtml:
          '<h1>Welcome to Ajaia Docs</h1>' +
          '<p>This document is owned by <strong>Alice</strong> and shared with <strong>Bob</strong> as an editor.</p>' +
          '<p>Try <strong>bold</strong>, <em>italic</em>, and <u>underline</u> from the toolbar.</p>' +
          '<ul><li>Create and rename documents</li><li>Import .txt, .md, or .docx files</li><li>Share with seeded teammates</li></ul>',
      }),
    );

    await this.shares.save(
      this.shares.create({
        documentId: welcome.id,
        userId: bob.id,
        role: ShareRole.EDITOR,
      }),
    );

    this.logger.info(
      { users: created.length, sampleDocument: welcome.id },
      'Seed complete: demo users and sample shared document created',
    );
  }
}
