/**
 * Custom error classes for API responses
 */

import { ErrorCode } from '../types/index.js';

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 400,
    code: ErrorCode = ErrorCode.INVALID_REQUEST,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends ApiError {
  constructor(message: string, code?: ErrorCode) {
    super(message, 400, code || ErrorCode.INVALID_REQUEST);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string, code?: ErrorCode) {
    super(message, 404, code || ErrorCode.RUN_NOT_FOUND);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends ApiError {
  constructor(message: string, code?: ErrorCode) {
    super(message, 409, code || ErrorCode.INVALID_REQUEST);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Unprocessable Entity Error (422)
 */
export class UnprocessableEntityError extends ApiError {
  constructor(message: string, code?: ErrorCode) {
    super(message, 422, code || ErrorCode.INVALID_REQUEST);
    this.name = 'UnprocessableEntityError';
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error', code?: ErrorCode) {
    super(message, 500, code || ErrorCode.INTERNAL_ERROR);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends InternalServerError {
  constructor(message: string = 'Database operation failed') {
    super(message, ErrorCode.DATABASE_ERROR);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
