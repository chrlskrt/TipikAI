import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { getCurrentRequest } from 'src/common/utils/request-context';
import { DB } from 'src/database/db';

@Injectable()
export class ChatService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<DB>) {}

  async create() {
    const req = getCurrentRequest();
    const user = req['user'];

    const newChat = await this.db
      .insertInto('public.chats')
      .values({ user_id: user.id })
      .returningAll()
      .executeTakeFirst();

    if (!newChat) {
      throw new Error('Failed to create chat.');
    }

    return newChat;
  }

  async findAll() {
    const req = getCurrentRequest();
    const user = req['user'];

    const chats = await this.db
      .selectFrom('public.chats')
      .where('user_id', '=', user.id)
      .selectAll()
      .execute();

    return chats;
  }

  async remove(chatId: string) {
    const req = getCurrentRequest();
    const user = req['user'];

    const res = await this.db
      .deleteFrom('public.chats')
      .where('id', '=', chatId)
      .where('user_id', '=', user.id)
      .executeTakeFirstOrThrow(
        () => new NotFoundException(`Chat with ID ${chatId} not found.`),
      );
  }
}
