import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { DocumentEntity } from './document.entity';
import { User } from './user.entity';
import { ShareRole } from './share-role.enum';

@Entity({ name: 'document_shares' })
@Unique('UQ_document_user', ['documentId', 'userId'])
export class DocumentShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentId: string;

  @ManyToOne(() => DocumentEntity, (doc) => doc.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // SQLite has no native enum; store the role as a constrained string.
  @Column({ type: 'varchar', default: ShareRole.VIEWER })
  role: ShareRole;

  @CreateDateColumn()
  createdAt: Date;
}
