export const AuditAction = {
  REGISTER: "REGISTER",
  LOGIN: "LOGIN",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  RESTORE: "RESTORE",
  ASSIGN_PERMISSIONS: "ASSIGN_PERMISSIONS",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];
