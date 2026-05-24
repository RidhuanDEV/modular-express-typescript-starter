import type { QueryInterface } from "sequelize";

const adminRoleId = "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1";
const userRoleId = "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2";

const manageUsersPermissionId = "c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3";
const manageRolesPermissionId = "d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4";
const managePermissionsPermissionId = "e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5";

const seeder = {
  async up(queryInterface: QueryInterface): Promise<void> {
    const now = new Date();

    // Insert Roles
    await queryInterface.bulkInsert("roles", [
      {
        id: adminRoleId,
        name: "admin",
        created_at: now,
        updated_at: now,
      },
      {
        id: userRoleId,
        name: "user",
        created_at: now,
        updated_at: now,
      },
    ]);

    // Insert Permissions
    await queryInterface.bulkInsert("permissions", [
      {
        id: manageUsersPermissionId,
        name: "manage_users",
        created_at: now,
        updated_at: now,
      },
      {
        id: manageRolesPermissionId,
        name: "manage_roles",
        created_at: now,
        updated_at: now,
      },
      {
        id: managePermissionsPermissionId,
        name: "manage_permissions",
        created_at: now,
        updated_at: now,
      },
    ]);

    // Insert Role-Permission mappings (Admin gets all permissions)
    await queryInterface.bulkInsert("role_permissions", [
      {
        role_id: adminRoleId,
        permission_id: manageUsersPermissionId,
      },
      {
        role_id: adminRoleId,
        permission_id: manageRolesPermissionId,
      },
      {
        role_id: adminRoleId,
        permission_id: managePermissionsPermissionId,
      },
    ]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Delete in reverse order of dependencies
    await queryInterface.bulkDelete("role_permissions", {
      role_id: [adminRoleId, userRoleId],
    });

    await queryInterface.bulkDelete("permissions", {
      id: [manageUsersPermissionId, manageRolesPermissionId, managePermissionsPermissionId],
    });

    await queryInterface.bulkDelete("roles", {
      id: [adminRoleId, userRoleId],
    });
  }
};

export = seeder;
