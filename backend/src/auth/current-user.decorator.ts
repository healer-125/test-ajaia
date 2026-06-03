import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './auth-user.interface';

/** Injects the authenticated user (populated by JwtStrategy) into a handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
