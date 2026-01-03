import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsNumber } from 'class-validator';

export class DatasetSearchDto {
  @ApiProperty({
    description: 'The topic or query for dataset search',
    example: 'customer churn prediction',
  })
  @IsString()
  datasetQuery: string;

  @ApiProperty({
    description: 'Optional list of data sources to search',
    example: ['Kaggle', 'UCI'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  sources?: string[];

  @ApiProperty({
    description: 'Optional chat ID to save the response as a message',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  chatId?: string;
}

export class DatasetInfoDto {
  @ApiProperty({
    description: 'Dataset title',
    example: 'Customer Churn Dataset',
  })
  @IsString()
  title: string;

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

export class DatasetSearchResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Successfully found dataset.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Dataset information',
    type: DatasetInfoDto,
  })
  data: DatasetInfoDto;
}
