import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    description: 'Title of the chat (e.g., model topic from wizard)',
    example: 'Predict customer churn',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
