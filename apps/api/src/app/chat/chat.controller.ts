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
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from 'src/common/dto/response.dto';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat for a user' })
  @ApiResponse({
    status: 201,
    description: 'Chat created successfully.',
    type: SuccessResponseDto,
    example: {
      message: 'Chat created successfully',
      data: {
        id: 1,
        userId: 'user-123',
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  async create() {
    const res = await this.chatService.create();
    return {
      message: 'Chat created successfully',
      data: res,
    };
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get all chats for a user' })
  @ApiResponse({
    status: 200,
    description: 'List of chats retrieved successfully.',
    type: SuccessResponseDto,
  })
  async findAll(@Param('userId') userId: string) {
    const chats = await this.chatService.findAll();
    return {
      message: 'List of chats retrieved successfully',
      data: chats,
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
    const res = await this.chatService.remove(id);
    return {
      message: 'Chat deleted successfully',
    };
  }
}
