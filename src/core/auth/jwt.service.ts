import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { JwtUserPayload } from "../../types/index.js";

export function signToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JwtUserPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  
  if (
    decoded &&
    typeof decoded === "object" &&
    "id" in decoded &&
    "email" in decoded &&
    "roleId" in decoded
  ) {
    if (
      typeof decoded.id === "string" &&
      typeof decoded.email === "string" &&
      typeof decoded.roleId === "string"
    ) {
      return {
        id: decoded.id,
        email: decoded.email,
        roleId: decoded.roleId,
      };
    }
  }
  
  throw new Error("Invalid token payload structure");
}
