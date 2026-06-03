import { api } from './client';
import type {
  Collaborator,
  DocumentDetail,
  DocumentSummary,
  LoginResponse,
  PublicUser,
  ShareRole,
} from './types';

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  },
  async me(): Promise<PublicUser> {
    const { data } = await api.get<{
      userId: string;
      email: string;
      displayName: string;
    }>('/auth/me');
    return {
      id: data.userId,
      email: data.email,
      displayName: data.displayName,
    };
  },
};

export const documentsApi = {
  async list(): Promise<DocumentSummary[]> {
    const { data } = await api.get<DocumentSummary[]>('/documents');
    return data;
  },
  async get(id: string): Promise<DocumentDetail> {
    const { data } = await api.get<DocumentDetail>(`/documents/${id}`);
    return data;
  },
  async create(payload: {
    title?: string;
    contentHtml?: string;
  }): Promise<DocumentDetail> {
    const { data } = await api.post<DocumentDetail>('/documents', payload);
    return data;
  },
  async update(
    id: string,
    payload: { title?: string; contentHtml?: string },
  ): Promise<DocumentDetail> {
    const { data } = await api.patch<DocumentDetail>(
      `/documents/${id}`,
      payload,
    );
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
  async upload(file: File): Promise<DocumentDetail> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<DocumentDetail>('/upload', form);
    return data;
  },
};

export const sharesApi = {
  async list(documentId: string): Promise<Collaborator[]> {
    const { data } = await api.get<Collaborator[]>(
      `/documents/${documentId}/shares`,
    );
    return data;
  },
  async grant(
    documentId: string,
    email: string,
    role: ShareRole,
  ): Promise<Collaborator> {
    const { data } = await api.post<Collaborator>(
      `/documents/${documentId}/shares`,
      { email, role },
    );
    return data;
  },
  async revoke(documentId: string, userId: string): Promise<void> {
    await api.delete(`/documents/${documentId}/shares/${userId}`);
  },
};

export const usersApi = {
  async list(): Promise<PublicUser[]> {
    const { data } = await api.get<PublicUser[]>('/users');
    return data;
  },
};
