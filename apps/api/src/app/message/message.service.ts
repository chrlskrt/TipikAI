import { Inject, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Kysely } from 'kysely';
import { DB } from 'src/database/db';
import { getCurrentRequest } from 'src/common/utils/request-context';

@Injectable()
export class MessageService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<DB>) {}

  async create(chatId: string, createMessageDto: CreateMessageDto) {
    // If content is a string, wrap it in {"text": "..."} for JSONB compatibility
    const jsonContent = typeof createMessageDto.content === 'string'
      ? { text: createMessageDto.content }
      : createMessageDto.content;

    const newMessage = await this.db
      .insertInto('messages')
      .values({
        chat_id: chatId,
        is_user: createMessageDto.isUser,
        content: JSON.stringify(jsonContent), // Kysely expects JSON as string
      })
      .returningAll()
      .executeTakeFirst();

    if (!newMessage) {
      throw new Error('Failed to create message.');
    }

    return newMessage;
  }

  async findAll(chatId: string) {
    const messages = await this.db
      .selectFrom('messages')
      .where('chat_id', '=', chatId)
      .selectAll()
      .groupBy('chat_id')
      .groupBy('id')
      .orderBy('created_at', 'asc')
      .execute();

    return messages;
  }
}
