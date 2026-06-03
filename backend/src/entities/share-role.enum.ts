export enum ShareRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
}

/** Access level reported to the client for a given document. */
export type AccessLevel = 'owner' | ShareRole;
