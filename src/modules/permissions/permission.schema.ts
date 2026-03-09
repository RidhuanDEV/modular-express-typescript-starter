import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z.string().min(1).max(128),
});

export const updatePermissionSchema = z.object({
  name: z.string().min(1).max(128).optional(),
});

export const permissionIdSchema = z.object({
  id: z.uuid(),
});

export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionDto = z.infer<typeof updatePermissionSchema>;
