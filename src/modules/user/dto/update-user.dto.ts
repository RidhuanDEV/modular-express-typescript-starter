import type { z } from 'zod';
import type { updateUserSchema } from '../user.schema.js';

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
