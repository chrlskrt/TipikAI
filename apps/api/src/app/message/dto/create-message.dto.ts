import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Is the message from the user?', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isUser: boolean;

  @ApiProperty({
    description: 'Content of the message (JSONB). Can be text {"text": "..."} or structured data',
    example: { text: 'Hello, how can I help you?' },
  })
  @IsNotEmpty()
  content: any; // Accept any JSON structure for JSONB
}
