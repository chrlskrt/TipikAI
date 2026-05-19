import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Is the message from the user?', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isUser: boolean;

  @ApiProperty({
    description: 'Content of the message (plain text).',
    example: 'Hello, how can I help you?',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: 'Optional User ID to link the chat', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
