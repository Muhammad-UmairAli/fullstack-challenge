import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateProjectDto } from './dto/projects.dto.js';
import { ProjectsService } from './projects.service.js';
import type { Request } from 'express';

@ApiTags('Portfolio Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  async findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new project entry' })
  @ApiResponse({
    status: 201,
    description: 'Project created!',
    type: CreateProjectDto,
  })
  async create(
    @Req() req: Request & { user: { id: string } },
    @Body() body: CreateProjectDto,
  ) {
    return this.projectsService.create(req.user.id, body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a project entry' })
  async update(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() body: CreateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a project entry' })
  async remove(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.projectsService.remove(id, req.user.id);
  }
}
