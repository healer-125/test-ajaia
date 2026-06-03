import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService, toPublicUser, PublicUser } from '../users/users.service';
import { JwtPayload } from './auth-user.interface';

export interface LoginResult {
  accessToken: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    // Always run the comparison shape to avoid leaking which emails exist.
    const valid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: toPublicUser(user),
    };
  }
}
