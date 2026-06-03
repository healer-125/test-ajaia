import { AccessLevel, ShareRole } from '../entities/share-role.enum';
import { PublicUser } from '../users/users.service';

export interface Collaborator {
  user: PublicUser;
  role: ShareRole;
}

export interface DocumentSummary {
  id: string;
  title: string;
  access: AccessLevel;
  owner: PublicUser;
  updatedAt: Date;
  createdAt: Date;
  sharedCount: number;
}

export interface DocumentDetail extends DocumentSummary {
  contentHtml: string;
  collaborators: Collaborator[];
}
