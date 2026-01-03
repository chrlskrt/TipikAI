import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHealth() {
    const now = new Date();
    // Convert to UTC+8 (Manila/Singapore time)
    const utc8Time = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    return {
      status: 'ok',
      message: 'TipikAI API is running',
      timestamp: now.toISOString(),
      utc8Time: utc8Time.toISOString(),
      localTime: utc8Time.toLocaleString('en-US', {
        timeZone: 'Asia/Singapore',
        dateStyle: 'full',
        timeStyle: 'long'
      }),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
  }
}
