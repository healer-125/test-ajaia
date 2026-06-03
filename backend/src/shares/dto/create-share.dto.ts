import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ShareRole } from '../../entities/share-role.enum';

export class CreateShareDto {
  @IsEmail({}, { message: 'A valid collaborator email is required' })
  email: string;

  @IsOptional()
  @IsEnum(ShareRole, { message: 'Role must be either "viewer" or "editor"' })
  role?: ShareRole;
}
