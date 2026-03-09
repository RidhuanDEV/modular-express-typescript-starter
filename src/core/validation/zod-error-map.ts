import { z } from "zod";

/**
 * Configures Zod to return validation error messages in Bahasa Indonesia.
 * Call once at application startup (in app.ts) before any schema parsing.
 */
export function configureZodLocale(): void {
  z.setErrorMap((rawIssue) => {
    // Cast to a plain record for safe property access across Zod 4's complex
    // $ZodRawIssue union type (which includes `& Record<string, unknown>`).
    const issue = rawIssue as Record<string, unknown>;
    const code = String(issue["code"] ?? "");

    switch (code) {
      // ── Required / wrong type ──────────────────────────────────────────
      case "invalid_type": {
        if (issue["input"] === undefined || issue["input"] === null) {
          return { message: "Field wajib diisi" };
        }
        const expected = String(issue["expected"] ?? "data");
        return { message: `Tipe data tidak valid, diharapkan ${expected}` };
      }

      // ── String/number/array minimum ────────────────────────────────────
      case "too_small": {
        const origin = String(issue["origin"] ?? "");
        const min = String(issue["minimum"] ?? "");
        if (origin === "string") return { message: `Minimal ${min} karakter` };
        if (origin === "number" || origin === "int")
          return { message: `Nilai minimal adalah ${min}` };
        if (origin === "array") return { message: `Minimal ${min} item` };
        if (origin === "date")
          return { message: `Tanggal terlalu awal (minimal ${min})` };
        return { message: `Nilai terlalu kecil (minimal ${min})` };
      }

      // ── String/number/array maximum ────────────────────────────────────
      case "too_big": {
        const origin = String(issue["origin"] ?? "");
        const max = String(issue["maximum"] ?? "");
        if (origin === "string") return { message: `Maksimal ${max} karakter` };
        if (origin === "number" || origin === "int")
          return { message: `Nilai maksimal adalah ${max}` };
        if (origin === "array") return { message: `Maksimal ${max} item` };
        if (origin === "date")
          return { message: `Tanggal terlalu jauh (maksimal ${max})` };
        return { message: `Nilai terlalu besar (maksimal ${max})` };
      }

      // ── String format (email, uuid, url, etc.) — Zod 4's invalid_format
      case "invalid_format": {
        const format = String(issue["format"] ?? "");
        switch (format) {
          case "email":
            return { message: "Format email tidak valid" };
          case "uuid":
            return { message: "Format UUID tidak valid" };
          case "url":
            return { message: "Format URL tidak valid" };
          case "datetime":
          case "date":
          case "time":
            return { message: "Format tanggal/waktu tidak valid" };
          case "ip":
            return { message: "Format IP address tidak valid" };
          case "regex":
            return { message: "Format tidak sesuai" };
          default:
            return { message: `Format ${format} tidak valid` };
        }
      }

      // ── Enum / literal (Zod 4's invalid_value) ────────────────────────
      case "invalid_value": {
        const values = Array.isArray(issue["values"])
          ? (issue["values"] as unknown[]).map(String).join(", ")
          : "";
        return {
          message: `Nilai tidak valid. Pilihan yang tersedia: ${values}`,
        };
      }

      // ── Unknown keys in strict objects ─────────────────────────────────
      case "unrecognized_keys": {
        const keys = Array.isArray(issue["keys"])
          ? (issue["keys"] as unknown[]).map(String).join(", ")
          : "";
        return { message: `Field tidak dikenali: ${keys}` };
      }

      // ── Number divisibility ────────────────────────────────────────────
      case "not_multiple_of": {
        const divisor = String(issue["divisor"] ?? "");
        return { message: `Nilai harus kelipatan ${divisor}` };
      }

      // ── Custom refinement errors ───────────────────────────────────────
      case "custom":
        return null; // use developer-provided message

      default:
        return null; // fall back to Zod default
    }
  });
}
