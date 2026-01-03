import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService], // Export for use in other modules
})
export class MessageModule {}
