import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import { User } from '../entities/user.entity';
import { DocumentEntity } from '../entities/document.entity';
import { DocumentShare } from '../entities/document-share.entity';
import { AppConfig } from '../config/configuration';

export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  const app = config.get<AppConfig>('app')!;

  // Ensure the directory for the SQLite file exists before TypeORM opens it.
  try {
    mkdirSync(dirname(app.databasePath), { recursive: true });
  } catch {
    // Directory already exists or cannot be created; TypeORM will surface a
    // clear error on connect if the path is truly unusable.
  }

  return {
    type: 'better-sqlite3',
    database: app.databasePath,
    entities: [User, DocumentEntity, DocumentShare],
    // Synchronize is acceptable for this scoped assignment (single SQLite file,
    // no migrations pipeline). For production we would switch to migrations.
    synchronize: true,
    autoLoadEntities: true,
  };
}
