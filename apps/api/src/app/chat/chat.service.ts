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
    const user = req ? req['user']  : null;

    if (!user) {
      console.warn('[ChatService] No user found in request during findAll');
      return [];
    }

    const userId = user.id || user.sub;
    if (!userId) {
      console.warn('[ChatService] User found but no ID/sub available during findAll', { user });
      return [];
    }

    // Return only chats that belong to this user
    const chats = await this.db
      .selectFrom('chats')
      .where('user_id', '=', userId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return chats;
  }

  async findOne(chatId: string) {
    const req = getCurrentRequest();
    const user = req ? req['user']  : null;
    const userId = user?.id || user?.sub;

    let query = this.db
      .selectFrom('chats')
      .where('id', '=', chatId);

    // If user is logged in, they can only see their own chats
    // If not logged in, they can see the chat if it's public (user_id is null)
    if (userId) {
      query = query.where((eb) => eb.or([
        eb('user_id', '=', userId),
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
    const user = req ? (req['user'] || (req as any).user) : null;
    const userId = user?.id || user?.sub;

    if (!userId) {
      throw new NotFoundException('User not authenticated.');
    }

    const updatedChat = await this.db
      .updateTable('chats')
      .set({ 
        title,
        updated_at: new Date(),
      })
      .where('id', '=', chatId)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();

    if (!updatedChat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found.`);
    }

    return updatedChat;
  }

  async remove(chatId: string) {
    const req = getCurrentRequest();
    const user = req ? (req['user'] || (req as any).user) : null;
    const userId = user?.id || user?.sub;

    if (!userId) {
      throw new NotFoundException('User not authenticated.');
    }

    await this.db
      .deleteFrom('chats')
      .where('id', '=', chatId)
      .where('user_id', '=', userId)
      .executeTakeFirstOrThrow(
        () => new NotFoundException(`Chat with ID ${chatId} not found.`),
      );
  }

  /**
   * Get or create a chat by session ID (treating sessionId as chatId)
   * This is for n8n integration where session_id is used as the chat identifier
   */
  async getOrCreateBySessionId(sessionId: string, title?: string, userId?: string) {
    const req = getCurrentRequest();
    const user = req ? (req['user'] || (req as any).user) : null;
    const finalUserId = userId || user?.id || user?.sub || null;

    // Validate UUID format. If not a UUID, we might need to handle it or use a default
    // Most postgres 'uuid' columns will throw if you pass a non-uuid string.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    
    if (!isUuid) {
      console.warn(`[ChatService] sessionId "${sessionId}" is not a valid UUID. If the DB column is UUID, this will fail.`);
      // If the DB requires UUID, and we get a non-uuid, we might need to hash it or return an error.
      // For now, we'll proceed and let the DB throw if it's strict, but we log the warning.
    }

    // Try to find existing chat by ID (session_id maps to chat.id)
    let chat = await this.db
      .selectFrom('chats')
      .where('id', '=', sessionId)
      .selectAll()
      .executeTakeFirst();

    // If chat doesn't exist, create it
    if (!chat) {
      console.log(`[ChatService] Creating new chat ${sessionId} for userId: ${finalUserId}`);
      chat = await this.db
        .insertInto('chats')
        .values({
          id: sessionId, // Use session_id as the chat ID
          user_id: finalUserId,
          title: title || 'New Chat',
        })
        .returningAll()
        .executeTakeFirst();

      if (!chat) {
        throw new Error('Failed to create chat.');
      }
    } else {
      // If chat exists, ensure it has the userId if passed (to link legacy chats if needed)
      if (finalUserId && !chat.user_id) {
        await this.db
          .updateTable('chats')
          .set({ user_id: finalUserId })
          .where('id', '=', sessionId)
          .execute();
      }

      if (title && (!chat.title || chat.title === 'New Chat' || chat.title === 'ML Assistant Chat')) {
        // If chat exists but has a placeholder title, update it with the new title
        const updatedChat = await this.db
          .updateTable('chats')
          .set({ title, updated_at: new Date() })
          .where('id', '=', sessionId)
          .returningAll()
          .executeTakeFirst();
        
        if (updatedChat) {
          chat = updatedChat;
        }
      }
    }

    return chat;
  }

  /**
   * Find a chat with all its messages
   * Useful for n8n to load full conversation history
   */
  async findOneWithMessages(chatId: string) {
    const req = getCurrentRequest();
    const user = req ? req['user'] : null;
    const userId = user?.id || user?.sub;

    let query = this.db
      .selectFrom('chats')
      .where('id', '=', chatId);

    // If user is logged in, they can only see their own chats
    // If not logged in, they can see the chat if it's public (user_id is null)
    if (userId) {
      query = query.where((eb) => eb.or([
        eb('user_id', '=', userId),
        eb('user_id', 'is', null)
      ]));
    } else {
      query = query.where('user_id', 'is', null);
    }

    const chat = await query.selectAll().executeTakeFirst();

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found.`);
    }

    // Get all messages for this chat
    const messages = await this.db
      .selectFrom('messages')
      .where('chat_id', '=', chatId)
      .selectAll()
      .orderBy('created_at', 'asc')
      .execute();

    return {
      ...chat,
      messages,
    };
  }
}

