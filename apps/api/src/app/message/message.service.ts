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
    const newMessage = await this.db
      .insertInto('public.messages')
      .values({
        chat_id: chatId,
        is_user: createMessageDto.isUser,
        content: createMessageDto.content,
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
      .selectFrom('public.messages')
      .where('chat_id', '=', chatId)
      .selectAll()
      .groupBy('chat_id')
      .groupBy('id')
      .orderBy('created_at', 'asc')
      .execute();

    return messages;
  }
}
