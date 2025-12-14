import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Is the message from the user?', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isUser: boolean;

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello, how can I help you?',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
