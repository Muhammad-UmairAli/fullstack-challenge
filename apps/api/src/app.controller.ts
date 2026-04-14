import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API Health Check' })
  getHello(): string {
    return this.appService.getHello();
  }
}
