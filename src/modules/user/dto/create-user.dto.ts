import type { z } from 'zod';
import type { createUserSchema } from '../user.schema.js';

export type CreateUserDto = z.infer<typeof createUserSchema>;
