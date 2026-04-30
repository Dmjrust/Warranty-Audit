import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChecklistAnswerDto {
  @IsString()
  questionId: string;

  answer: boolean | string | number;
}

export class EvaluateChecklistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistAnswerDto)
  answers: ChecklistAnswerDto[];
}
