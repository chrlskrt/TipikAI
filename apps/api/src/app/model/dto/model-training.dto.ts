import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class ModelTrainingDto {
  @ApiProperty({
    description: 'Session ID from the dataset search step',
    example: 'session-1234567890',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Model format/type to generate',
    example: 'pickle',
    enum: ['pickle', 'onnx', 'tensorflow', 'pytorch'],
  })
  @IsString()
  modelFormat: string;

  @ApiProperty({
    description: 'Optional chat ID to save the response as a message',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  chatId?: string;
}

export class ModelResultsDto {
  @ApiProperty({
    description: 'Model accuracy score',
    example: 0.92,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @ApiProperty({
    description: 'Model precision score',
    example: 0.89,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  precision?: number;

  @ApiProperty({
    description: 'Model recall score',
    example: 0.91,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  recall?: number;

  @ApiProperty({
    description: 'Model F1 score',
    example: 0.90,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  f1Score?: number;

  @ApiProperty({
    description: 'Confusion matrix',
    example: [[85, 15], [12, 88]],
    required: false,
  })
  @IsArray()
  @IsOptional()
  confusionMatrix?: number[][];

  @ApiProperty({
    description: 'URL to download the trained model',
    example: '/downloads/model.pickle',
    required: false,
  })
  @IsString()
  @IsOptional()
  downloadUrl?: string;

  @ApiProperty({
    description: 'URL to the training notebook',
    example: '/notebooks/training-123.ipynb',
    required: false,
  })
  @IsString()
  @IsOptional()
  notebookUrl?: string;
}

export class ModelTrainingResponseDto {
  @ApiProperty({
    description: 'Workflow ID for tracking',
    example: 'workflow-1234567890',
  })
  @IsString()
  workflowId: string;

  @ApiProperty({
    description: 'Status of the training process',
    example: 'completed',
    enum: ['processing', 'completed', 'failed'],
  })
  @IsString()
  status: 'processing' | 'completed' | 'failed';

  @ApiProperty({
    description: 'Model training results',
    type: ModelResultsDto,
    required: false,
  })
  @IsOptional()
  results?: ModelResultsDto;

  @ApiProperty({
    description: 'Error message if training failed',
    example: 'Training failed due to insufficient data',
    required: false,
  })
  @IsString()
  @IsOptional()
  error?: string;
}
