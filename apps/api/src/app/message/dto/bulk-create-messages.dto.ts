import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMessageDto } from './create-message.dto';

export class BulkCreateMessagesDto {
  @ApiProperty({
    description: 'Optional User ID to associate with the chat if it is created',
    example: 'user-123',
    required: false
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Array of messages to be saved',
    type: [CreateMessageDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMessageDto)
  messages: CreateMessageDto[];
}
