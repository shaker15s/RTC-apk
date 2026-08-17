/**
 * Core Result type and domain error classes for robust error handling.
 * Prevents silent failures, empty-array masking, and unhandled exceptions.
 */

export type Result<T, E = AppError> =
  | { success: true; data: T; error?: never }
  | { success: false; error: E; data?: never };

export namespace Result {
  export function ok<T>(data: T): Result<T, never> {
    return { success: true, data };
  }

  export function err<E extends AppError>(error: E): Result<never, E> {
    return { success: false, error };
  }

  export function isOk<T, E>(res: Result<T, E>): res is { success: true; data: T } {
    return res.success;
  }

  export function isErr<T, E>(res: Result<T, E>): res is { success: false; error: E } {
    return !res.success;
  }

  export function unwrapOr<T, E>(res: Result<T, E>, fallback: T): T {
    return res.success ? res.data : fallback;
  }
}

export type ErrorKind =
  | 'network'
  | 'auth'
  | 'permission'
  | 'schema'
  | 'not_found'
  | 'validation'
  | 'unknown';

export class AppError extends Error {
  readonly kind: ErrorKind;
  readonly userMessage: string;
  readonly details?: any;
  readonly code?: string;

  constructor(options: {
    kind: ErrorKind;
    message: string;
    userMessage: string;
    code?: string;
    details?: any;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.kind = options.kind;
    this.userMessage = options.userMessage;
    this.code = options.code;
    this.details = options.details;
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection failed', details?: any) {
    super({
      kind: 'network',
      message,
      userMessage: 'تعذر الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة ثانية.',
      code: 'NETWORK_ERROR',
      details,
    });
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required or session expired', details?: any) {
    super({
      kind: 'auth',
      message,
      userMessage: 'انتهت جلستك أو يلزم تسجيل الدخول مجدداً.',
      code: 'AUTH_ERROR',
      details,
    });
    this.name = 'AuthError';
  }
}

export class PermissionError extends AppError {
  constructor(message = 'Access denied (RLS / Role restriction)', details?: any) {
    super({
      kind: 'permission',
      message,
      userMessage: 'ليس لديك صلاحية للوصول إلى هذه البيانات أو تنفيذ الإجراء.',
      code: 'PERMISSION_DENIED',
      details,
    });
    this.name = 'PermissionError';
  }
}

export class SchemaMismatchError extends AppError {
  constructor(message = 'Database schema or RPC contract mismatch', details?: any) {
    super({
      kind: 'schema',
      message,
      userMessage: 'حدث خطأ في توافق البيانات. يرجى تحديث التطبيق إلى أحدث إصدار.',
      code: 'SCHEMA_MISMATCH',
      details,
    });
    this.name = 'SchemaMismatchError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity = 'Item', details?: any) {
    super({
      kind: 'not_found',
      message: `${entity} not found`,
      userMessage: 'العنصر المطلوب غير موجود أو تم حذفه.',
      code: 'NOT_FOUND',
      details,
    });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(userMessage: string, details?: any) {
    super({
      kind: 'validation',
      message: userMessage,
      userMessage,
      code: 'VALIDATION_ERROR',
      details,
    });
    this.name = 'ValidationError';
  }
}

/**
 * Maps Supabase / PostgreSQL / Network errors to typed AppError with friendly Arabic messages.
 */
export function mapSupabaseError(error: any): AppError {
  if (!error) {
    return new AppError({
      kind: 'unknown',
      message: 'Unknown error occurred',
      userMessage: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
    });
  }

  if (error instanceof AppError) {
    return error;
  }

  const rawMessage = String(error.message || error.error_description || error);
  const code = String(error.code || '');

  // Network / Fetch errors
  if (
    rawMessage.includes('Network request failed') ||
    rawMessage.includes('Failed to fetch') ||
    rawMessage.includes('AbortError') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('connection refused')
  ) {
    return new NetworkError(rawMessage, error);
  }

  // Permission / RLS errors (42501 is PostgreSQL insufficient_privilege)
  if (
    code === '42501' ||
    rawMessage.includes('permission denied') ||
    rawMessage.includes('violates row-level security policy')
  ) {
    return new PermissionError(rawMessage, error);
  }

  // Not Found (PGRST116 is single row expected but 0 rows returned)
  if (code === 'PGRST116' || rawMessage.includes('0 rows')) {
    return new NotFoundError('Record', error);
  }

  // Schema / Column missing errors (42703 is undefined_column, 42883 is undefined_function)
  if (
    code === '42703' ||
    code === '42883' ||
    code === 'PGRST202' ||
    rawMessage.includes('column') ||
    rawMessage.includes('function')
  ) {
    return new SchemaMismatchError(rawMessage, error);
  }

  // Auth specific
  if (
    rawMessage.includes('JWT') ||
    rawMessage.includes('token is expired') ||
    rawMessage.includes('Invalid login credentials')
  ) {
    return new AuthError(rawMessage, error);
  }

  // Validation / Unique Constraint (23505 is unique_violation)
  if (code === '23505' || rawMessage.includes('duplicate key')) {
    return new ValidationError('هذا السجل موجود بالفعل ومسجل مسبقاً.', error);
  }

  return new AppError({
    kind: 'unknown',
    message: rawMessage,
    userMessage: 'تعذر إتمام العملية. يرجى المحاولة لاحقاً.',
    code,
    details: error,
  });
}
