import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService, PublicUser } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Used by the share dialog to let an owner pick a collaborator.
  @Get()
  list(): Promise<PublicUser[]> {
    return this.users.listPublic();
  }
}
