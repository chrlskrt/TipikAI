import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ModelService } from './model.service';
import {
  StartExecutionDto,
  ExecutionResponseDto,
  UpdateExecutionStatusDto,
} from './dto/execution.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Model')
@Controller('model')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Post('execute')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Start a new model generation execution' })
  @ApiBody({ type: StartExecutionDto })
  @ApiResponse({
    status: 201,
    description: 'Execution started successfully.',
    type: ExecutionResponseDto,
  })
  async startExecution(
    @Body() dto: StartExecutionDto,
  ): Promise<ExecutionResponseDto> {
    console.log('[Controller] POST /model/execute - Starting execution:', JSON.stringify(dto, null, 2));
    const result = await this.modelService.startExecution(dto);
    console.log('[Controller] Execution started successfully:', result.id);
    return result;
  }

  @Get('execution/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get execution status by ID' })
  @ApiParam({ name: 'id', description: 'Execution ID' })
  @ApiResponse({
    status: 200,
    description: 'Execution status retrieved successfully.',
    type: ExecutionResponseDto,
  })
  async getExecutionStatus(
    @Param('id') id: string,
  ): Promise<ExecutionResponseDto> {
    console.log('[Controller] GET /model/execution/:id - Fetching status for:', id);
    const result = await this.modelService.getExecutionStatus(id);
    console.log('[Controller] Status fetched:', result.status, result.progress + '%');
    return result;
  }

  @Get('executions/chat/:chatId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get executions by chat ID' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Executions retrieved successfully.',
    type: [ExecutionResponseDto],
  })
  async getExecutionsByChatId(
    @Param('chatId') chatId: string,
  ): Promise<ExecutionResponseDto[]> {
    return this.modelService.getExecutionsByChatId(chatId);
  }

  @Post('execution/:id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel a running execution (graceful stop)' })
  @ApiParam({ name: 'id', description: 'Execution ID' })
  @ApiResponse({
    status: 200,
    description: 'Execution cancelled successfully.',
    type: ExecutionResponseDto,
  })
  async cancelExecution(
    @Param('id') id: string,
  ): Promise<ExecutionResponseDto> {
    return this.modelService.cancelExecution(id);
  }

  @Post('execution/:id/retry')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retry a failed execution' })
  @ApiParam({ name: 'id', description: 'Execution ID' })
  @ApiResponse({
    status: 200,
    description: 'Execution retried successfully.',
    type: ExecutionResponseDto,
  })
  async retryExecution(
    @Param('id') id: string,
  ): Promise<ExecutionResponseDto> {
    return this.modelService.retryExecution(id);
  }

  @Post('webhook/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook endpoint for n8n to update execution status',
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully.',
    type: ExecutionResponseDto,
  })
  async updateExecutionStatus(
    @Body() updateDto: UpdateExecutionStatusDto,
  ): Promise<ExecutionResponseDto> {
    console.log('[Controller] POST /model/webhook/status - Received update:', JSON.stringify({
      executionId: updateDto.executionId,
      status: updateDto.status,
      progress: updateDto.progress,
      currentStage: updateDto.currentStage,
      hasDatasetInfo: !!updateDto.data?.datasetInfo,
      hasModel: !!updateDto.data?.model,
      hasNotebook: !!updateDto.data?.notebook,
    }, null, 2));
    const result = await this.modelService.updateExecutionStatus(updateDto);
    console.log('[Controller] Webhook update successful');
    return result;
  }
}
