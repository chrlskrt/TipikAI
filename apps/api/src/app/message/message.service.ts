import { Inject, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Kysely } from 'kysely';
import { DB } from '../../database/db';

@Injectable()
export class MessageService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<DB>) {}

  async create(chatId: string, createMessageDto: CreateMessageDto) {
    console.log(`[MessageService] Creating message for chatId: ${chatId}`, { 
      isUser: createMessageDto.isUser, 
      contentType: typeof createMessageDto.content 
    });
    
    // If content is a string, wrap it in {"text": "..."} for JSONB compatibility
    // This ensures that even simple text messages follow a consistent structured format in DB
    const jsonContent = typeof createMessageDto.content === 'string'
      ? { text: createMessageDto.content }
      : createMessageDto.content;

    try {
      const newMessage = await this.db
        .insertInto('messages')
        .values({
          chat_id: chatId,
          is_user: createMessageDto.isUser,
          content: jsonContent,
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
}
