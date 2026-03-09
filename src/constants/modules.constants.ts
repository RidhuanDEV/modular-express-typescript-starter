export const MODULES = {
  AUTH: "auth",
  USER: "user",
  ROLE: "role",
  PERMISSION: "permission",
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

export const AUTH_MODULE = MODULES.AUTH;
export const USER_MODULE = MODULES.USER;
export const ROLE_MODULE = MODULES.ROLE;
export const PERMISSION_MODULE = MODULES.PERMISSION;
