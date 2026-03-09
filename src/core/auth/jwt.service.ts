import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { JwtUserPayload } from "../../types/index.js";

export function signToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JwtUserPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
}
