/**
 * Global error handling middleware for Express.js
 * Catches any errors that weren't caught in the route handlers
 * and returns a standardized error response.
 */
const errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    // Determine status code based on error type
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    // Handle specific types of errors with appropriate status codes
    if (err.type === 'validation') {
      statusCode = 400;
      errorMessage = err.message || 'Validation failed';
    } else if (err.type === 'not_found') {
      statusCode = 404;
      errorMessage = err.message || 'Resource not found';
    } else if (err.type === 'conflict') {
      statusCode = 409;
      errorMessage = err.message || 'Resource conflict';
    } else if (err.type === 'unauthorized') {
      statusCode = 401;
      errorMessage = err.message || 'Unauthorized';
    } else if (err.type === 'forbidden') {
      statusCode = 403;
      errorMessage = err.message || 'Forbidden';
    }
    
    // Include stack trace in development mode
    const errorResponse = {
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
    
    // Include stack trace in development environment
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
    }
    
    // Send error response
    res.status(statusCode).json(errorResponse);
  };
  
  module.exports = errorHandler;