import bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository.js";
import { signToken } from "../../core/auth/jwt.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { auditService } from "../../core/audit/audit.service.js";
import { sequelize } from "../../config/database.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { AUTH_MODULE, USER_MODULE } from "../../constants/modules.constants.js";
import type { RegisterDto, LoginDto } from "./auth.schema.js";
import type { User } from "../user/user.model.js";

const SALT_ROUNDS = 12;
const DEFAULT_ROLE = "user";
const repository = new AuthRepository();

function safeUser(user: User): Omit<User["dataValues"], "password"> {
  const { password: _password, ...safe } =
    user.toJSON() as User["dataValues"] & { password: string };
  return safe;
}

export class AuthService {
  async register(dto: RegisterDto) {
    const exists = await repository.emailExists(dto.email);
    if (exists) {
      throw HttpError.conflict("Email already registered");
    }

    const defaultRole = await repository.findRoleByName(DEFAULT_ROLE);
    if (!defaultRole) {
      throw HttpError.internal(
        "Default role not found. Please seed the database.",
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await sequelize.transaction(async (trx) => {
      const created = await repository.createUser(
        {
          email: dto.email,
          password: hashedPassword,
          roleId: defaultRole.id,
        },
        trx,
      );

      await auditService.persist({
        action: AuditAction.REGISTER,
        module: USER_MODULE,
        entityId: created.id,
        userId: created.id,
        after: created.toJSON(),
        trx,
      });

      return created;
    });

    return safeUser(user);
  }

  async login(dto: LoginDto) {
    const user = await repository.findByEmail(dto.email);

    if (!user) {
      throw HttpError.unauthorized("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw HttpError.unauthorized("Invalid email or password");
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    auditService.log(AuditAction.LOGIN, AUTH_MODULE, user.id, {
      email: user.email,
    });

    return { token };
  }

  async me(userId: string) {
    const user = await repository.findById(userId);
    if (!user) throw HttpError.notFound("User not found");
    return safeUser(user);
  }
}
