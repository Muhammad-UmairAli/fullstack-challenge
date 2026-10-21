import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service.js';
import { ProjectsService } from './projects.service.js';

type AnyFn = (...args: any[]) => any;

const input = {
  title: 'Portfolio',
  description: 'A personal portfolio site',
  techStack: ['NestJS'],
};

describe('ProjectsService', () => {
  let service: ProjectsService;
  const prisma = {
    project: {
      findUnique: jest.fn<AnyFn>(),
      update: jest.fn<AnyFn>(),
      delete: jest.fn<AnyFn>(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ProjectsService);
  });

  it('throws 404 for a missing project', async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("refuses to update another user's project", async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'p1', userId: 'owner' });

    await expect(
      service.update('p1', 'intruder', input),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  it("refuses to delete another user's project", async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'p1', userId: 'owner' });

    await expect(service.remove('p1', 'intruder')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  it('lets the owner delete their project', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'p1', userId: 'owner' });
    prisma.project.delete.mockResolvedValue({});

    await expect(service.remove('p1', 'owner')).resolves.toEqual({
      message: 'Project deleted successfully',
    });
  });
});
