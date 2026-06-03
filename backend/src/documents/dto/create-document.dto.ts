import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Title must be 200 characters or fewer' })
  title?: string;

  @IsOptional()
  @IsString()
  contentHtml?: string;
}
