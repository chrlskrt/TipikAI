import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ErrorResponseDto {
  @ApiProperty({ example: 'Something went wrong' })
  message: string;

  @ApiProperty({
    example: 'Field "name" must not be empty',
    description: 'Detailed error, if any',
    required: false,
  })
  error: string;
}

export class SuccessResponseDto<T> {
  @ApiProperty({ description: 'Response status' })
  @IsOptional()
  status?: string = 'success';

  @ApiProperty({ example: 'Request successful' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data?: T;
}
