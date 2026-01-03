import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';

// ============================================
// Start Execution DTOs
// ============================================

export class StartExecutionDto {
  @ApiProperty({
    description: 'The model prompt/topic for generation',
    example: 'customer churn prediction model',
  })
  @IsString()
  modelPrompt: string;

  @ApiProperty({
    description: 'Model format/type to generate',
    example: 'pickle',
    enum: ['pickle', 'onnx', 'tensorflow', 'pytorch'],
  })
  @IsString()
  modelFormat: string;

  @ApiProperty({
    description: 'Optional list of data sources to search',
    example: ['Kaggle', 'UCI'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  sources?: string[];

  @ApiProperty({
    description: 'Optional chat ID to associate with this execution',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  chatId?: string;
}

// ============================================
// Dataset Info (from n8n)
// ============================================

export class DatasetInfoDto {
  @ApiProperty({
    description: 'Dataset title',
    example: 'Customer Churn Dataset',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Sanitized folder name for the dataset',
    example: 'customer_churn_dataset',
  })
  @IsString()
  title_directory: string;

  @ApiProperty({
    description: 'Dataset description',
    example: 'A comprehensive dataset for predicting customer churn',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'URL to the dataset',
    example: 'https://kaggle.com/datasets/customer-churn',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Source of the dataset',
    example: 'Kaggle',
  })
  @IsString()
  source: string;
}

// ============================================
// File Info (from Supabase Storage)
// ============================================

export class FileInfoDto {
  @ApiProperty({
    description: 'Filename',
    example: 'model.h5',
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'Signed URL for download',
    example: 'https://project.supabase.co/storage/v1/object/sign/...',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'ISO timestamp when signed URL expires',
    example: '2026-01-10T16:43:00Z',
  })
  @IsString()
  expiresAt: string;
}

// ============================================
// Execution Results (from n8n)
// ============================================

export class ExecutionResultsDto {
  @ApiProperty({
    description: 'Generated model files (can be multiple)',
    type: [FileInfoDto],
  })
  @IsOptional()
  models?: FileInfoDto[];

  @ApiProperty({
    description: 'Generated notebook files (can be multiple)',
    type: [FileInfoDto],
  })
  @IsOptional()
  notebooks?: FileInfoDto[];
}

// ============================================
// Execution Response DTO
// ============================================

export class ExecutionResponseDto {
  @ApiProperty({
    description: 'Execution ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Current execution status',
    example: 'searching_dataset',
    enum: [
      'pending',
      'searching_dataset',
      'dataset_found',
      'downloading',
      'preprocessing',
      'training',
      'complete',
      'failed',
      'cancelled',
    ],
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Current stage description',
    example: 'Searching for dataset',
    required: false,
  })
  @IsString()
  @IsOptional()
  currentStage?: string;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiProperty({
    description: 'Dataset information (available after dataset_found status)',
    type: DatasetInfoDto,
    required: false,
  })
  @IsOptional()
  datasetInfo?: DatasetInfoDto;

  @ApiProperty({
    description: 'Execution results (available after complete status)',
    type: ExecutionResultsDto,
    required: false,
  })
  @IsOptional()
  results?: ExecutionResultsDto;

  @ApiProperty({
    description: 'Error message if execution failed',
    example: 'Dataset search failed: No datasets found',
    required: false,
  })
  @IsString()
  @IsOptional()
  error?: string;

  @ApiProperty({
    description: 'Execution creation timestamp',
    example: '2026-01-03T16:43:00Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-03T16:45:00Z',
  })
  @IsString()
  updatedAt: string;
}

// ============================================
// Update Execution Status DTO (for n8n webhook)
// ============================================

export class UpdateExecutionStatusDto {
  @ApiProperty({
    description: 'Execution ID from n8n',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  executionId: string;

  @ApiProperty({
    description: 'New status',
    example: 'searching_dataset',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 30,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiProperty({
    description: 'Current stage description',
    example: 'Searching for dataset',
    required: false,
  })
  @IsString()
  @IsOptional()
  currentStage?: string;

  @ApiProperty({
    description: 'Stage-specific data (dataset info, results, etc.)',
    required: false,
  })
  @IsObject()
  @IsOptional()
  data?: any;
}
