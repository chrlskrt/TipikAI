import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { BulkCreateMessagesDto } from './dto/bulk-create-messages.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '../../common/dto/response.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-auth.guard';

@ApiBearerAuth()
@UseGuards(OptionalJwtAuthGuard)
@Controller('chat/:chatId/message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new message in a chat' })
  @ApiResponse({
    status: 201,
    description: 'Message created successfully.',
    type: SuccessResponseDto,
    example: {
      message: 'Message created successfully',
      data: {
        id: 1,
        chatId: 'chat-123',
        isUser: false,
        content: 'Hello, how can I help you?',
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  async create(
    @Param('chatId') chatId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    const res = await this.messageService.create(chatId, createMessageDto);
    return {
      message: 'Message created successfully',
      data: res,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all messages in a chat' })
  @ApiResponse({
    status: 200,
    description: 'List of messages retrieved successfully.',
    type: SuccessResponseDto,
  })
  async findAll(@Param('chatId') chatId: string) {
    const messages = await this.messageService.findAll(chatId);
    return {
      message: 'List of messages retrieved successfully',
      data: messages,
    };
  }

  @Post('bulk')
  @ApiOperation({ 
    summary: 'Create multiple messages at once',
    description: 'For n8n integration: Allows saving both user message and AI response in a single request'
  })
  @ApiResponse({
    status: 201,
    description: 'Messages created successfully.',
    type: SuccessResponseDto,
    example: {
      message: 'Messages created successfully',
      data: [
        {
          id: '1',
          chat_id: 'chat-123',
          is_user: true,
          content: { text: 'User question' },
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          chat_id: 'chat-123',
          is_user: false,
          content: { text: 'AI response' },
          created_at: '2024-01-01T00:00:01Z',
        },
      ],
    },
  })
  async createBulk(
    @Param('chatId') chatId: string,
    @Body() payload: CreateMessageDto[] | BulkCreateMessagesDto,
  ) {
    const createdMessages = await this.messageService.createBulk(chatId, payload);
    return {
      message: 'Messages created successfully',
      data: createdMessages,
    };
  }
}
