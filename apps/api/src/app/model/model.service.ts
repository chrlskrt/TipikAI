import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { DatabaseService } from '../../database/database.service';
import { getCurrentRequest } from '../../common/utils/request-context';
import {
  StartExecutionDto,
  ExecutionResponseDto,
  UpdateExecutionStatusDto,
} from './dto/execution.dto';

@Injectable()
export class ModelService {
  private readonly logger = new Logger(ModelService.name);
  private readonly useN8n: boolean;
  private readonly n8nClient: AxiosInstance;
  private readonly n8nSecret: string;
  private readonly modelExecutionEndpoint: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
  ) {
    this.useN8n = this.configService.get<string>('USE_N8N') === 'true';
    const n8nBaseUrl = this.configService.get<string>('N8N_BASE_URL');
    this.n8nSecret =
      this.configService.get<string>('N8N_WEBHOOK_SECRET') || '';
    this.modelExecutionEndpoint =
      this.configService.get<string>('N8N_MODEL_EXECUTION_ENDPOINT') ||
      '/webhook/model-execution';

    if (this.useN8n) {
      this.logger.log('n8n integration enabled');
      this.logger.log(`n8n base URL: ${n8nBaseUrl}`);
      this.logger.log(
        `n8n auth: ${this.n8nSecret ? 'configured' : 'not configured'}`,
      );

      this.n8nClient = axios.create({
        baseURL: n8nBaseUrl,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      this.logger.warn('n8n integration is DISABLED');
    }
  }

  /**
   * Start a new model generation execution
   */
  async startExecution(
    startExecutionDto: StartExecutionDto,
  ): Promise<ExecutionResponseDto> {
    const req = getCurrentRequest();
    const user = req['user'];

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (!this.useN8n) {
      throw new Error('n8n integration is disabled. Set USE_N8N=true in .env');
    }

    this.logger.log('[Execution] Starting new execution:', startExecutionDto);

    // Create execution record in database
    const execution = await this.db['db']
      .insertInto('executions')
      .values({
        user_id: user.id,
        chat_id: startExecutionDto.chatId || null,
        model_prompt: startExecutionDto.modelPrompt,
        model_format: startExecutionDto.modelFormat,
        sources: startExecutionDto.sources || [],
        status: 'pending',
        progress: 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    this.logger.log(`[Execution] Created execution: ${execution.id}`);

    const headers: Record<string, string> = {
      'X-N8N-Secret': this.n8nSecret,
      'X-User-Id': user.id,
      'X-Execution-Id': execution.id,
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'TipikAI-Backend',
    };

    try {
      // Trigger n8n workflow
      this.logger.log(`[Execution] Triggering n8n at: ${this.n8nClient.defaults.baseURL}${this.modelExecutionEndpoint}`);
      
      const response = await this.n8nClient.post(
        this.modelExecutionEndpoint,
        {
          executionId: execution.id,
          modelPrompt: startExecutionDto.modelPrompt,
          modelFormat: startExecutionDto.modelFormat,
          sources: startExecutionDto.sources || [],
        },
        { headers },
      );

      this.logger.log(`[Execution] n8n response status: ${response.status}`);

      this.logger.log(`[Execution] Triggered n8n workflow for: ${execution.id}`);

      // Update execution with started_at timestamp
      await this.db['db']
        .updateTable('executions')
        .set({ started_at: new Date().toISOString() })
        .where('id', '=', execution.id)
        .execute();
    } catch (error: any) {
      // Enhanced error logging
      this.logger.error('[Execution] Failed to trigger n8n:', {
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
      });

      const error_message = error.response?.data?.message 
        || error.message 
        || 'Unknown error occurred';
      
      // Update execution status to failed
      await this.db['db']
        .updateTable('executions')
        .set({
          status: 'failed',
          error_message: `Failed to start workflow: ${error_message}`,
        })
        .where('id', '=', execution.id)
        .execute();

      throw new Error(`Failed to start execution: ${error_message}`);
    }

    return this.formatExecutionResponse(execution);
  }

  /**
   * Get execution status by ID
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionResponseDto> {
    const execution = await this.db['db']
      .selectFrom('executions')
      .selectAll()
      .where('id', '=', executionId)
      .executeTakeFirst();

    if (!execution) {
      throw new NotFoundException(`Execution ${executionId} not found`);
    }

    return this.formatExecutionResponse(execution);
  }

  /**
   * Get executions by chat ID (for loading chat history)
   */
  async getExecutionsByChatId(chatId: string): Promise<ExecutionResponseDto[]> {
    const executions = await this.db['db']
      .selectFrom('executions')
      .selectAll()
      .where('chat_id', '=', chatId)
      .orderBy('created_at', 'desc')
      .execute();

    return executions.map(execution => this.formatExecutionResponse(execution));
  }

  /**
   * Update execution status (called by n8n webhook)
   */
  async updateExecutionStatus(
    updateDto: UpdateExecutionStatusDto,
  ): Promise<ExecutionResponseDto> {
    this.logger.log('[Execution] Updating status:', updateDto);

    const execution = await this.db['db']
      .selectFrom('executions')
      .selectAll()
      .where('id', '=', updateDto.executionId)
      .executeTakeFirst();

    if (!execution) {
      throw new NotFoundException(`Execution ${updateDto.executionId} not found`);
    }

    // Prepare update data
    const updateData: any = {
      status: updateDto.status,
      current_stage: updateDto.currentStage || null,
      progress: updateDto.progress ?? execution.progress,
    };

    // Handle stage-specific data
    if (updateDto.data) {
      // Dataset info (when status is dataset_found)
      if (updateDto.data.datasetInfo) {
        updateData.dataset_info = JSON.stringify(updateDto.data.datasetInfo);
      }

      // Results - ACCUMULATE models and notebooks
      if (updateDto.data.model || updateDto.data.notebook) {
        // Get existing results
        let existingResults: any = {};
        if (execution.results) {
          try {
            existingResults = JSON.parse(execution.results as string);
          } catch (e) {
            this.logger.warn('Failed to parse existing results, starting fresh');
          }
        }

        // Initialize arrays if they don't exist
        if (!existingResults.models) existingResults.models = [];
        if (!existingResults.notebooks) existingResults.notebooks = [];

        // Append new model if provided
        if (updateDto.data.model) {
          existingResults.models.push(updateDto.data.model);
        }

        // Append new notebook if provided
        if (updateDto.data.notebook) {
          existingResults.notebooks.push(updateDto.data.notebook);
        }

        updateData.results = JSON.stringify(existingResults);
        
        // Only set completed_at when status is actually complete
        if (updateDto.status === 'complete') {
          updateData.completed_at = new Date().toISOString();
        }
      }
    }

    // Handle failed status
    if (updateDto.status === 'failed' && updateDto.data?.error) {
      updateData.error_message = updateDto.data.error;
      console.log("faildlsddf")
    }

    // Update execution
    const updatedExecution = await this.db['db']
      .updateTable('executions')
      .set(updateData)
      .where('id', '=', updateDto.executionId)
      .returningAll()
      .executeTakeFirstOrThrow();

    this.logger.log(`[Execution] Updated: ${updatedExecution.id} -> ${updatedExecution.status}`);

    return this.formatExecutionResponse(updatedExecution);
  }

  /**
   * Cancel execution (graceful stop)
   */
  async cancelExecution(executionId: string): Promise<ExecutionResponseDto> {
    this.logger.log(`[Execution] Canceling: ${executionId}`);

    const execution = await this.db['db']
      .selectFrom('executions')
      .selectAll()
      .where('id', '=', executionId)
      .executeTakeFirst();

    if (!execution) {
      throw new NotFoundException(`Execution ${executionId} not found`);
    }

    // Only cancel if not already complete/failed/cancelled
    if (['complete', 'failed', 'cancelled'].includes(execution.status)) {
      throw new Error(`Cannot cancel execution with status: ${execution.status}`);
    }

    // Update to cancelled status (graceful - n8n will handle stopping)
    const updatedExecution = await this.db['db']
      .updateTable('executions')
      .set({
        status: 'cancelled',
        error_message: 'Execution cancelled by user',
      })
      .where('id', '=', executionId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.formatExecutionResponse(updatedExecution);
  }

  /**
   * Retry failed execution (reuses same ID)
   */
  async retryExecution(executionId: string): Promise<ExecutionResponseDto> {
    this.logger.log(`[Execution] Retrying: ${executionId}`);

    const execution = await this.db['db']
      .selectFrom('executions')
      .selectAll()
      .where('id', '=', executionId)
      .executeTakeFirst();

    if (!execution) {
      throw new NotFoundException(`Execution ${executionId} not found`);
    }

    // Only retry if failed
    if (execution.status !== 'failed') {
      throw new Error(`Cannot retry execution with status: ${execution.status}`);
    }

    // Reset execution to pending
    const updatedExecution = await this.db['db']
      .updateTable('executions')
      .set({
        status: 'pending',
        progress: 0,
        current_stage: null,
        error_message: null,
        dataset_info: null,
        results: null,
        started_at: null,
        completed_at: null,
      })
      .where('id', '=', executionId)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Trigger n8n workflow again
    const req = getCurrentRequest();
    const user = req['user'];

    const headers: Record<string, string> = {
      'X-N8N-Secret': this.n8nSecret,
      'X-User-Id': user?.id || execution.user_id,
      'X-Execution-Id': execution.id,
    };

    try {
      await this.n8nClient.post(
        this.modelExecutionEndpoint,
        {
          executionId: execution.id,
          modelPrompt: execution.model_prompt,
          modelFormat: execution.model_format,
          sources: execution.sources || [],
        },
        { headers },
      );

      // Update started_at
      await this.db['db']
        .updateTable('executions')
        .set({ started_at: new Date().toISOString() })
        .where('id', '=', executionId)
        .execute();

      this.logger.log(`[Execution] Retried: ${executionId}`);
    } catch (error) {
      this.logger.error('[Execution] Retry failed:', error.message);
      throw new Error(`Failed to retry execution: ${error.message}`);
    }

    return this.formatExecutionResponse(updatedExecution);
  }

  /**
   * Format execution record to response DTO
   */
  private formatExecutionResponse(execution: any): ExecutionResponseDto {
    // Helper to safely parse JSON fields
    const safeJsonParse = (value: any, fieldName: string) => {
      if (!value) return undefined;
      
      // If it's already an object, return it
      if (typeof value === 'object') return value;
      
      // If it's a string, try to parse it
      if (typeof value === 'string') {
        // Check for invalid "[object Object]" string
        if (value === '[object Object]') {
          this.logger.warn(`[Execution] Invalid JSON string "[object Object]" found in ${fieldName}`);
          return undefined;
        }
        
        try {
          return JSON.parse(value);
        } catch (error) {
          this.logger.error(`[Execution] Failed to parse ${fieldName}: ${error.message}`);
          return undefined;
        }
      }
      
      return undefined;
    };

    return {
      id: execution.id,
      status: execution.status,
      currentStage: execution.current_stage,
      progress: execution.progress || 0,
      datasetInfo: safeJsonParse(execution.dataset_info, 'dataset_info'),
      results: safeJsonParse(execution.results, 'results'),
      error: execution.error_message,
      createdAt: execution.created_at,
      updatedAt: execution.updated_at,
    };
  }
}
