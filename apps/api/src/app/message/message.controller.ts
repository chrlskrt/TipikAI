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
import { UpdateMessageDto } from './dto/update-message.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '../../common/dto/response.dto';

@Controller('chat/:chatId/message')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
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
}
