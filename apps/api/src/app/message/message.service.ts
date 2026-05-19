import { Inject, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ChatService } from '../chat/chat.service';
import { Kysely } from 'kysely';
import { DB } from '../../database/db';

@Injectable()
export class MessageService {
  constructor(
    @Inject('DATABASE') private readonly db: Kysely<DB>,
    private readonly chatService: ChatService,
  ) {}

  async create(chatId: string, createMessageDto: CreateMessageDto) {
    console.log(`[MessageService] Creating message for chatId: ${chatId}`, { 
      isUser: createMessageDto.isUser, 
      contentType: typeof createMessageDto.content,
      userId: createMessageDto.userId
    });

    // Extract potential title if it's a user message
    let potentialTitle: string | undefined;
    if (createMessageDto.isUser && createMessageDto.content) {
      const text = createMessageDto.content;
      if (text) {
        potentialTitle = text.length > 100 ? text.substring(0, 97) + '...' : text;
      }
    }

    // Ensure chat exists (for n8n integration)
    await this.chatService.getOrCreateBySessionId(chatId, potentialTitle, createMessageDto.userId);

    try {
      const newMessage = await this.db
        .insertInto('messages')
        .values({
          chat_id: chatId,
          is_user: createMessageDto.isUser,
          content: createMessageDto.content,
        })
        .returningAll()
        .executeTakeFirst();

      if (!newMessage) {
        console.error(`[MessageService] Failed to create message for chatId: ${chatId} - No record returned`);
        throw new Error('Failed to create message: No record returned from database');
      }

      console.log(`[MessageService] Message created successfully with ID: ${newMessage.id}`);
      return newMessage;
    } catch (error) {
      console.error(`[MessageService] Error creating message for chatId: ${chatId}:`, error);
      throw error;
    }
  }

  async findAll(chatId: string) {
    return await this.db
      .selectFrom('messages')
      .where('chat_id', '=', chatId)
      .selectAll()
      .orderBy('created_at', 'asc')
      .execute();
  }

  /**
   * Create multiple messages at once (bulk insert)
   * Useful for n8n to save both user and AI messages in one request
   */
  async createBulk(chatId: string, payload: CreateMessageDto[] | { userId?: string, messages: CreateMessageDto[] }) {
    const isArray = Array.isArray(payload);
    const messages = isArray ? payload : payload.messages;
    const userId = isArray ? undefined : payload.userId;

    console.log(`[MessageService] Creating ${messages.length} messages for chatId: ${chatId}${userId ? ` and userId: ${userId}` : ''}`);

    // Extract potential title from the first user message
    const firstUserMsg = messages.find(m => m.isUser);
    let potentialTitle: string | undefined;
    
    if (firstUserMsg && firstUserMsg.content) {
      const text = firstUserMsg.content;
      
      if (text) {
        // Limit title to 100 chars
        potentialTitle = text.length > 100 ? text.substring(0, 97) + '...' : text;
      }
    }

    // Ensure chat exists (for n8n integration where chat might not be created yet)
    await this.chatService.getOrCreateBySessionId(chatId, potentialTitle, userId);

    // Prepare all messages for insertion
    const messagesToInsert = messages.map((msg) => {
      return {
        chat_id: chatId,
        is_user: msg.isUser,
        content: msg.content,
      };
    });

    try {
      const createdMessages = await this.db
        .insertInto('messages')
        .values(messagesToInsert)
        .returningAll()
        .execute();

      if (!createdMessages || createdMessages.length === 0) {
        console.error(`[MessageService] Failed to create messages for chatId: ${chatId}`);
        throw new Error('Failed to create messages: No records returned from database');
      }

      console.log(`[MessageService] Successfully created ${createdMessages.length} messages`);
      return createdMessages;
    } catch (error) {
      console.error(`[MessageService] Error creating bulk messages for chatId: ${chatId}:`, error);
      throw error;
    }
  }
}
