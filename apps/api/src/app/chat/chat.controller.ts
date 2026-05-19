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
import { OptionalJwtAuthGuard } from '../auth/optional-auth.guard';

/**
 * FUTURE API KEY AUTHENTICATION STRATEGY
 * 
 * To add API key authentication for n8n integration:
 * 
 * 1. Create an API Key Guard:
 *    - Create file: src/app/auth/api-key.guard.ts
 *    - Implement CanActivate interface
 *    - Check for 'X-API-Key' header
 *    - Validate against environment variable or database
 * 
 * 2. Apply to n8n-specific endpoints:
 *    @UseGuards(ApiKeyGuard)
 *    @Post('session/:sessionId/get-or-create')
 *    async getOrCreateBySession(...) { }
 * 
 * 3. Configure in .env:
 *    N8N_API_KEY=your-secure-api-key-here
 * 
 * 4. Update n8n HTTP Request nodes:
 *    Headers:
 *      X-API-Key: your-secure-api-key-here
 */

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('chat')
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

  @Post('session/:sessionId/get-or-create')
  @ApiOperation({ 
    summary: 'Get or create a chat by session ID',
    description: 'For n8n integration: Maps session_id to chat.id. Creates chat if it doesn\'t exist, returns existing chat otherwise. Optionally includes all messages for loading conversation history.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'ML Assistant Chat' },
        includeMessages: { type: 'boolean', example: true },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Chat retrieved or created successfully.',
    type: SuccessResponseDto,
    example: {
      message: 'Chat retrieved successfully',
      data: {
        id: 'session-123',
        user_id: null,
        title: 'ML Assistant Chat',
        created_at: '2024-01-01T00:00:00Z',
        messages: [],
      },
    },
  })
  async getOrCreateBySession(
    @Param('sessionId') sessionId: string,
    @Body('title') title?: string,
    @Body('userId') userId?: string,
    @Body('includeMessages') includeMessages?: boolean,
  ) {
    // Get or create the chat
    let chat: any;
    
    if (includeMessages) {
      // Try to get chat with messages first
      try {
        chat = await this.chatService.findOneWithMessages(sessionId);
        return {
          message: 'Chat retrieved successfully',
          data: chat,
        };
      } catch (error) {
        // Chat doesn't exist, create it
        chat = await this.chatService.getOrCreateBySessionId(sessionId, title, userId);
        return {
          message: 'Chat created successfully',
          data: {
            ...chat,
            messages: [],
          },
        };
      }
    } else {
      chat = await this.chatService.getOrCreateBySessionId(sessionId, title, userId);
      const isNew = !chat.created_at || new Date(chat.created_at).getTime() > Date.now() - 1000;
      return {
        message: isNew ? 'Chat created successfully' : 'Chat retrieved successfully',
        data: chat,
      };
    }
  }
}
