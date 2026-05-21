export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message = 'Bad request', details?: unknown): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Conflict', details?: unknown): ApiError {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static tooMany(message = 'Too many requests'): ApiError {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'Internal error'): ApiError {
    return new ApiError(500, 'INTERNAL', message);
  }
}
