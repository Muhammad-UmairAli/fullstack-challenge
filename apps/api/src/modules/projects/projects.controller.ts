import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/projects.dto.js';

@ApiTags('Portfolio Projects')
@Controller('projects')
export class ProjectsController {
  @Post()
  @ApiOperation({ summary: 'Create a new project entry' })
  @ApiResponse({
    status: 201,
    description: 'Project created!',
    type: CreateProjectDto,
  })
  create(@Body() body: CreateProjectDto) {
    return {
      message: 'Project modular logic triggered',
      project: body,
    };
  }
}
