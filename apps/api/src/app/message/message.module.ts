import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { DatabaseModule } from '../../database/database.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [DatabaseModule, ChatModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService], // Export for use in other modules
})
export class MessageModule {}
