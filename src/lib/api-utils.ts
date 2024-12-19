// src/lib/api-utils.ts

export interface ApiError {
  error: string;
  details?: unknown;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiError).error === 'string'
  );
}

export function handleApiError(error: unknown): ApiError {
  console.error('API Error:', error);
  
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      details: error.stack
    };
  }

  return {
    error: 'An unexpected error occurred',
    details: error
  };
}