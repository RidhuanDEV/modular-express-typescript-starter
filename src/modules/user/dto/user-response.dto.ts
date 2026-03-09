export interface RoleWithPermissionsDto {
  id: string;
  name: string;
  permissions?: Array<{
    id: string;
    name: string;
  }>;
}

export interface UserResponseDto {
  id: string;
  email: string;
  roleId: string;
  role?: RoleWithPermissionsDto;
  /** ISO 8601 string — matches the actual JSON serialisation over HTTP. */
  createdAt: string;
  updatedAt: string;
}

export type UserResponseProjection = Partial<UserResponseDto>;
