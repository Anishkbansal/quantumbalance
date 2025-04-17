/**
 * Utility functions for consistent error handling across the application
 */

/**
 * Format API error for consistent frontend display
 * @param {unknown} error - The error object
 * @param {string} fallbackMessage - Fallback message if no specific error message is available
 * @returns {string} Formatted error message
 */
export const formatApiError = (error: unknown, fallbackMessage = 'An unexpected error occurred'): string => {
  if (!error) return fallbackMessage;
  
  // Type guard for axios error
  type AxiosError = {
    response?: {
      data?: { message?: string };
      status?: number;
      statusText?: string;
    };
    request?: unknown;
    message?: string;
  };
  
  // Handle Axios errors
  const axiosError = error as AxiosError;
  if (axiosError.response) {
    // Server responded with a status other than 2xx
    return axiosError.response.data?.message || 
           `Server error: ${axiosError.response.status} ${axiosError.response.statusText}`;
  } else if (axiosError.request) {
    // Request was made but no response was received
    return 'Network error: Server did not respond. Please check your connection.';
  } else if (axiosError.message) {
    // Something else happened in setting up the request
    return axiosError.message;
  }
  
  // For non-Axios errors with a message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  // For string errors
  if (typeof error === 'string') {
    return error;
  }
  
  return fallbackMessage;
};

/**
 * Log errors with consistent formatting
 * @param {string} location - Where the error occurred (e.g., component/function name)
 * @param {unknown} error - The error object
 * @param {Record<string, unknown>} additionalInfo - Any additional context about the error
 */
export const logError = (location: string, error: unknown, additionalInfo: Record<string, unknown> = {}): void => {
  // In production, we might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Production logging - could be sent to a service like Sentry
    console.error(`[${location}] Error:`, error);
  } else {
    // Development logging - more verbose
    console.group(`[${location}] Error`);
    console.error('Error details:', error);
    if (Object.keys(additionalInfo).length > 0) {
      console.info('Additional context:', additionalInfo);
    }
    console.trace('Stack trace:');
    console.groupEnd();
  }
};

/**
 * Handle WebSocket connection errors gracefully
 * @param {unknown} error - The WebSocket error
 * @returns {void}
 */
export const handleWebSocketError = (error: unknown): void => {
  // Convert error to string for checking
  const errorString = String(error);
  const errorMessage = error && typeof error === 'object' && 'message' in error 
    ? String((error as { message: unknown }).message) 
    : errorString;
  
  // In development, the webpack-dev-server WebSocket errors are expected and can be suppressed
  if (process.env.NODE_ENV === 'development' && 
      (errorMessage.includes('WebSocket') || errorString.includes('WebSocket'))) {
    // Just suppress the error or log at a lower level
    console.warn('WebSocket connection issue during development (likely hot reloading) - this can be ignored');
    return;
  }
  
  // For other WebSocket errors, log normally
  logError('WebSocket', error);
};

/**
 * Global error handler for uncaught exceptions
 * Call once at application startup
 */
export const setupGlobalErrorHandling = (): void => {
  if (typeof window !== 'undefined') {
    // Browser environment
    window.addEventListener('error', (event) => {
      const errorMessage = event.message || '';
      const errorObject = event.error || new Error(event.message || 'Unknown error');
      
      // Handle WebSocket errors specially
      if (errorMessage.includes('WebSocket') || errorObject.toString().includes('WebSocket')) {
        handleWebSocketError(errorObject);
        // Prevent default browser error handling
        event.preventDefault();
        return;
      }
      
      // Log other errors
      logError('Uncaught Exception', errorObject);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      logError('Unhandled Promise Rejection', event.reason);
    });
  }
}; 