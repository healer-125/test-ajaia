/** Shape of the authenticated principal attached to each request. */
export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
