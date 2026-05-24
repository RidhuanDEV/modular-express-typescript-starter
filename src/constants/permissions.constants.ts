export const PERMISSION_GROUPS = {
  USER: {
    MANAGE: "manage_users",
  },
  ROLE: {
    MANAGE: "manage_roles",
  },
  PERMISSION: {
    MANAGE: "manage_permissions",
  },
  PRODUCT: {
    CREATE: "create_product",
    UPDATE: "update_product",
    DELETE: "delete_product",
    VIEW: "view_product",
  },
} as const;

type PermissionGroups = typeof PERMISSION_GROUPS;

export type PermissionName = {
  [K in keyof PermissionGroups]:
    PermissionGroups[K][keyof PermissionGroups[K]];
}[keyof PermissionGroups];

export const USER_PERMISSIONS = PERMISSION_GROUPS.USER;
export const ROLE_PERMISSIONS = PERMISSION_GROUPS.ROLE;
export const PERMISSION_PERMISSIONS = PERMISSION_GROUPS.PERMISSION;
export const PRODUCT_PERMISSIONS = PERMISSION_GROUPS.PRODUCT;
