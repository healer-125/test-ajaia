import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DocumentShare } from './document-share.entity';

@Entity({ name: 'documents' })
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Untitled document' })
  title: string;

  // Rich-text content stored as sanitized HTML produced by the TipTap editor.
  @Column({ type: 'text', default: '' })
  contentHtml: string;

  @Index()
  @Column()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => DocumentShare, (share) => share.document, { cascade: true })
  shares: DocumentShare[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
