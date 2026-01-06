// Error Handler for API Calls

export class APIError extends Error {
    constructor(
        message: string,
        public code?: string,
        public status?: number,
        public details?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// Error types
export enum ErrorType {
    VALIDATION = 'VALIDATION_ERROR',
    AUTHENTICATION = 'AUTHENTICATION_ERROR',
    AUTHORIZATION = 'AUTHORIZATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    RATE_LIMIT = 'RATE_LIMIT',
    SERVER_ERROR = 'SERVER_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN = 'UNKNOWN_ERROR'
}

// Map Supabase errors to user-friendly messages
function mapSupabaseError(error: any): { type: ErrorType; message: string } {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Authentication errors
    if (errorCode === 'PGRST301' || errorMessage.includes('jwt')) {
        return {
            type: ErrorType.AUTHENTICATION,
            message: 'Your session has expired. Please log in again.'
        };
    }

    // Permission errors
    if (errorCode === '42501' || errorMessage.includes('permission denied')) {
        return {
            type: ErrorType.AUTHORIZATION,
            message: 'You don\'t have permission to perform this action.'
        };
    }

    // Not found errors
    if (errorCode === 'PGRST116' || errorMessage.includes('not found')) {
        return {
            type: ErrorType.NOT_FOUND,
            message: 'The requested resource was not found.'
        };
    }

    // Unique constraint violations
    if (errorCode === '23505' || errorMessage.includes('duplicate key')) {
        return {
            type: ErrorType.CONFLICT,
            message: 'A record with this information already exists.'
        };
    }

    // Foreign key violations
    if (errorCode === '23503') {
        return {
            type: ErrorType.VALIDATION,
            message: 'Referenced record does not exist.'
        };
    }

    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        return {
            type: ErrorType.NETWORK_ERROR,
            message: 'Network error. Please check your connection and try again.'
        };
    }

    // Default server error
    return {
        type: ErrorType.SERVER_ERROR,
        message: 'An unexpected error occurred. Please try again later.'
    };
}

// Handle API errors with retry logic
export async function handleAPICall<T>(
    operation: () => Promise<T>,
    options?: {
        retries?: number;
        retryDelay?: number;
        onRetry?: (attempt: number, error: any) => void;
    }
): Promise<T> {
    const { retries = 3, retryDelay = 1000, onRetry } = options || {};
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Don't retry on client errors (validation, auth, etc.)
            if (error.status && error.status >= 400 && error.status < 500) {
                throw error;
            }

            // Retry on server errors and network issues
            if (attempt < retries) {
                onRetry?.(attempt, error);
                await delay(retryDelay * attempt); // Exponential backoff
                continue;
            }
        }
    }

    throw lastError;
}

// Delay utility
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Wrap Supabase errors
export function wrapSupabaseError(error: any): APIError {
    const { type, message } = mapSupabaseError(error);
    return new APIError(
        message,
        type,
        error.status,
        error.details
    );
}

// Log errors for debugging
export function logError(context: string, error: any): void {
    if (process.env.NODE_ENV === 'development') {
        console.error(`[${context}]`, error);
    }

    // In production, send to error tracking service
    // e.g., Sentry, LogRocket, etc.
}

// Format validation errors from Zod
export function formatValidationError(error: any): string {
    if (error.errors && Array.isArray(error.errors)) {
        return error.errors
            .map((err: any) => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
    }
    return error.message || 'Validation failed';
}

// Show user-friendly error toast/notification
export function showErrorNotification(error: any, context?: string): void {
    let message = 'An error occurred';

    if (error instanceof APIError) {
        message = error.message;
    } else if (error.message) {
        message = error.message;
    }

    // You can integrate with your toast/notification system here
    console.error(context ? `${context}: ${message}` : message);

    // Example: toast.error(message);
}

export default {
    APIError,
    ErrorType,
    handleAPICall,
    wrapSupabaseError,
    logError,
    formatValidationError,
    showErrorNotification
};
