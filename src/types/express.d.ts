import type { JwtUserPayload } from "./index.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: JwtUserPayload;
    }
  }
}

export {};
