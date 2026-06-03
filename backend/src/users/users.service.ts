import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase().trim() } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async listPublic(): Promise<PublicUser[]> {
    const all = await this.users.find({ order: { displayName: 'ASC' } });
    return all.map(toPublicUser);
  }
}
