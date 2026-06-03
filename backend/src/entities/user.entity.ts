import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DocumentEntity } from './document.entity';
import { DocumentShare } from './document-share.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => DocumentEntity, (doc) => doc.owner)
  documents: DocumentEntity[];

  @OneToMany(() => DocumentShare, (share) => share.user)
  shares: DocumentShare[];
}
