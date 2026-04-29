import { createZodDto } from 'nestjs-zod';
import { ProjectSchema } from '@repo/validators';

/**
 * 💡 Consistency
 * We keep the DTO name specific to the module even if it uses a shared schema.
 */
export class CreateProjectDto extends createZodDto(ProjectSchema) {}
