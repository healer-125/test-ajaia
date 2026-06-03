export type ShareRole = 'viewer' | 'editor';
export type AccessLevel = 'owner' | ShareRole;

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
}

export interface Collaborator {
  user: PublicUser;
  role: ShareRole;
}

export interface DocumentSummary {
  id: string;
  title: string;
  access: AccessLevel;
  owner: PublicUser;
  updatedAt: string;
  createdAt: string;
  sharedCount: number;
}

export interface DocumentDetail extends DocumentSummary {
  contentHtml: string;
  collaborators: Collaborator[];
}

export interface LoginResponse {
  accessToken: string;
  user: PublicUser;
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}
