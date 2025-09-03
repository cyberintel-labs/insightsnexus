/**
 * Error Handling Middleware
 * 
 * This middleware provides centralized error handling and logging for the application.
 * It ensures consistent error responses and proper error logging.
 * 
 * Key Features:
 * - Centralized error processing
 * - Consistent error response format
 * - Error logging and debugging
 * - Graceful error handling
 */

import { Request, Response, NextFunction } from "express";

/**
 * Error Response Interface
 * 
 * Defines the structure for error responses across the application.
 */
export interface ErrorResponse {
    error: string;
    timestamp?: string;
    path?: string;
    method?: string;
}

/**
 * Global Error Handler Middleware
 * 
 * errorHandler(err: Error, req: Request, res: Response, next: NextFunction)
 * 
 * Centralized error handling middleware that processes all errors
 * and returns consistent error responses.
 * 
 * Input:
 * - err: Error - The error object
 * - req: Request - Express request object
 * - res: Response - Express response object
 * - next: NextFunction - Express next function
 * 
 * Process:
 * 1. Logs error details for debugging
 * 2. Formats error response consistently
 * 3. Sends appropriate HTTP status code
 * 4. Includes request context for debugging
 * 
 * Error Response Format:
 * - error: string - Error message
 * - timestamp: string - Error occurrence time
 * - path: string - Request path
 * - method: string - HTTP method
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
    // Log error details for debugging
    console.error("Error occurred:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Determine appropriate status code
    let statusCode = 500;
    if (err.name === "ValidationError") {
        statusCode = 400;
    } else if (err.name === "UnauthorizedError") {
        statusCode = 401;
    } else if (err.name === "NotFoundError") {
        statusCode = 404;
    }

    // Format error response
    const errorResponse: ErrorResponse = {
        error: err.message || "Internal server error",
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };

    // Send error response
    res.status(statusCode).json(errorResponse);
}

/**
 * Async Error Handler Wrapper
 * 
 * asyncHandler(fn: Function)
 * 
 * Wraps async route handlers to automatically catch and forward errors
 * to the error handling middleware.
 * 
 * Input:
 * - fn: Function - Async route handler function
 * 
 * Returns:
 * - Function - Wrapped function with error handling
 * 
 * Usage:
 * - Wrap async route handlers to avoid try-catch blocks
 * - Automatically forwards errors to error handling middleware
 * - Maintains Express error handling chain
 */
export function asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Request Logging Middleware
 * 
 * requestLogger(req: Request, res: Response, next: NextFunction)
 * 
 * Logs incoming requests for debugging and monitoring purposes.
 * 
 * Input:
 * - req: Request - Express request object
 * - res: Response - Express response object
 * - next: NextFunction - Express next function
 * 
 * Process:
 * 1. Logs request details before processing
 * 2. Tracks response time
 * 3. Logs response status after completion
 * 
 * Logged Information:
 * - HTTP method and path
 * - Request timestamp
 * - Response status code
 * - Response time
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
}

/**
 * Validation Error Handler
 * 
 * validationErrorHandler(err: Error, req: Request, res: Response, next: NextFunction)
 * 
 * Handles validation errors specifically and formats them consistently.
 * 
 * Input:
 * - err: Error - The validation error
 * - req: Request - Express request object
 * - res: Response - Express response object
 * - next: NextFunction - Express next function
 * 
 * Process:
 * 1. Checks if error is a validation error
 * 2. Formats validation error response
 * 3. Sends 400 status code for validation errors
 * 
 * Validation Error Format:
 * - error: string - Validation error message
 * - field?: string - Field that failed validation
 * - value?: any - Invalid value provided
 */
export function validationErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
    if (err.name === "ValidationError" || err.message.includes("validation")) {
        const errorResponse: ErrorResponse = {
            error: err.message,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        };
        
        res.status(400).json(errorResponse);
        return;
    }
    
    next(err);
}
