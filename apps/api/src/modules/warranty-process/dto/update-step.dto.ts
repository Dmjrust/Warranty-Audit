import { IsObject, IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateVehicleStepDto {
  @IsString()
  vin: string;

  @IsString()
  modelo: string;

  hodometro: number;

  @IsString()
  @IsOptional()
  sistemaAfetado?: string;

  @IsString()
  @IsOptional()
  codigoFalha?: string;

  @IsString()
  @IsOptional()
  anoFabricacao?: string;
}

export class UpdateChecklistStepDto {
  @IsArray()
  answers: Array<{ questionId: string; answer: boolean | string | number }>;
}

export class UpdateAnalysisStepDto {
  @IsString()
  sintomas: string;

  @IsString()
  inspecaoInicial: string;

  @IsString()
  causaRaiz: string;

  @IsString()
  @IsOptional()
  testesRealizados?: string;

  @IsString()
  @IsOptional()
  historicoIntervencoes?: string;

  @IsArray()
  @IsOptional()
  imageUrls?: string[];
}

export class UpdateVerdictStepDto {
  scoreSt: number | null;
  scoreSh: number;
}
