import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ValidateEligibilityDto {
  @IsString()
  vin: string;

  @IsNumber()
  @Min(0)
  hodometro: number;

  @IsString()
  @IsOptional()
  modelo?: string;

  @IsString()
  @IsOptional()
  sistema_afetado?: string;

  @IsString()
  @IsOptional()
  codigo_falha?: string;
}
