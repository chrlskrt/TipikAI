import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { getCurrentRequest } from '../../common/utils/request-context';
import { DB } from '../../database/db';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
  constructor(@Inject('DATABASE') private readonly db: Kysely<DB>) {}

  async create(createChatDto?: CreateChatDto) {
    const req = getCurrentRequest();
    const user = req ? req['user'] : null;

    const newChat = await this.db
      .insertInto('chats')
      .values({ 
        user_id: user?.id || null,
        title: createChatDto?.title || null,
      })
      .returningAll()
      .executeTakeFirst();

    if (!newChat) {
      throw new Error('Failed to create chat.');
    }

    return newChat;
  }

  async findAll() {
    const req = getCurrentRequest();
    const user = req ? req['user'] : null;

    if (!user) {
      return []; // Return empty list for unauthenticated requests
    }

    const chats = await this.db
      .selectFrom('chats')
      .where('user_id', '=', user.id)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return chats;
  }

  async findOne(chatId: string) {
    const req = getCurrentRequest();
    const user = req ? req['user'] : null;

    let query = this.db
      .selectFrom('chats')
      .where('id', '=', chatId);

    // If user is logged in, they can only see their own chats
    // If not logged in, they can see the chat if it's public (user_id is null)
    if (user) {
      query = query.where((eb) => eb.or([
        eb('user_id', '=', user.id),
        eb('user_id', 'is', null)
      ]));
    } else {
      query = query.where('user_id', 'is', null);
    }

    const chat = await query.selectAll().executeTakeFirst();

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found.`);
    }

    return chat;
  }

  async updateTitle(chatId: string, title: string) {
    const req = getCurrentRequest();
    const user = req['user'];

    const updatedChat = await this.db
      .updateTable('chats')
      .set({ 
        title,
        updated_at: new Date(),
      })
      .where('id', '=', chatId)
      .where('user_id', '=', user.id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedChat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found.`);
    }

    return updatedChat;
  }

  async remove(chatId: string) {
    const req = getCurrentRequest();
    const user = req['user'];

    await this.db
      .deleteFrom('chats')
      .where('id', '=', chatId)
      .where('user_id', '=', user.id)
      .executeTakeFirstOrThrow(
        () => new NotFoundException(`Chat with ID ${chatId} not found.`),
      );
  }
}

