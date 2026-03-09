import type { z } from "zod";
import type { searchUserSchema } from "../user.schema.js";

export type SearchUserDto = z.infer<typeof searchUserSchema>;
