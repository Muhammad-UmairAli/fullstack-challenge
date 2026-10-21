import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { ProjectInput } from '@repo/validators';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(userId: string, data: ProjectInput) {
    return this.prisma.project.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async update(id: string, userId: string, data: ProjectInput) {
    await this.assertOwnership(id, userId);

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.assertOwnership(id, userId);

    await this.prisma.project.delete({
      where: { id },
    });

    return { message: 'Project deleted successfully' };
  }

  /**
   * Responds 404 (not 403) for other users' projects so IDs cannot be probed.
   */
  private async assertOwnership(id: string, userId: string) {
    const project = await this.findOne(id);

    if (project.userId !== userId) {
      throw new NotFoundException('Project not found');
    }
  }
}
