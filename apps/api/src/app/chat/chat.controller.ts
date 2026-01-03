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
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SuccessResponseDto } from '../../common/dto/response.dto';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat for a user' })
  @ApiBody({ type: CreateChatDto, required: false })
  @ApiResponse({
    status: 201,
    description: 'Chat created successfully.',
    type: SuccessResponseDto,
    example: {
      message: 'Chat created successfully',
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        title: 'Predict customer churn',
        created_at: '2024-01-01T00:00:00Z',
      },
    },
  })
  async create(@Body() createChatDto?: CreateChatDto) {
    const res = await this.chatService.create(createChatDto);
    return {
      message: 'Chat created successfully',
      data: res,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of chats retrieved successfully.',
    type: SuccessResponseDto,
  })
  async findAll() {
    const chats = await this.chatService.findAll();
    return {
      message: 'List of chats retrieved successfully',
      data: chats,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific chat by ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat retrieved successfully.',
    type: SuccessResponseDto,
  })
  async findOne(@Param('id') id: string) {
    const chat = await this.chatService.findOne(id);
    return {
      message: 'Chat retrieved successfully',
      data: chat,
    };
  }

  @Patch(':id/title')
  @ApiOperation({ summary: 'Update chat title' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated model topic' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Chat title updated successfully.',
    type: SuccessResponseDto,
  })
  async updateTitle(
    @Param('id') id: string,
    @Body('title') title: string,
  ) {
    const chat = await this.chatService.updateTitle(id, title);
    return {
      message: 'Chat title updated successfully',
      data: chat,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chat by ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted successfully.',
    type: SuccessResponseDto,
  })
  async remove(@Param('id') id: string) {
    await this.chatService.remove(id);
    return {
      message: 'Chat deleted successfully',
    };
  }
}
