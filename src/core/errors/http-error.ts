export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown[];

  constructor(statusCode: number, message: string, errors: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  static badRequest(message = "Bad Request", errors: unknown[] = []) {
    return new HttpError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new HttpError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new HttpError(403, message);
  }

  static notFound(message = "Not Found") {
    return new HttpError(404, message);
  }

  static conflict(message = "Conflict") {
    return new HttpError(409, message);
  }

  static internal(message = "Internal Server Error") {
    return new HttpError(500, message);
  }
}
