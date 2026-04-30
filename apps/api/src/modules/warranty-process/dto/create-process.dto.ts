import { IsString, IsOptional } from 'class-validator';

export class CreateProcessDto {
  @IsString()
  @IsOptional()
  numeroOS?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
