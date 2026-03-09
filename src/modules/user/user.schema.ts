import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().uuid("roleId must be a valid UUID"),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  roleId: z.string().uuid("roleId must be a valid UUID").optional(),
});

export const userIdSchema = z.object({
  id: z.uuid(),
});

export const searchUserSchema = z.object({
  page: z.coerce.number().int().default(1),
  limit: z.coerce.number().int().default(10),
  sortBy: z.string().optional(),
  orderBy: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  fields: z.string().optional(),
});
