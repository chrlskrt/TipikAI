import { Module } from '@nestjs/common';
import { ModelService } from './model.service';
import { ModelController } from './model.controller';
import { ModelGateway } from './model.gateway';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ModelController],
  providers: [ModelService, ModelGateway],
})
export class ModelModule {}
