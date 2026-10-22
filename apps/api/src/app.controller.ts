import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API Root' })
  getRoot() {
    return {
      status: 'ok',
      name: 'CAS Digital Platform API',
      version: '1.0',
      docs: '/api/docs',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health Check' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
