// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  

  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message;


  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR :', err);
  }

  // Handle specific PostgreSQL errors
  
  // Duplicate key error 
  if (err.code === '23505') {
    statusCode = 400;
    message = 'Duplicate field value. Please use another value';
  }

  // Foreign key constraint error
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record not found';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again';
  }

 
  res.status(statusCode).json({
    status,
    message,
  
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err
    })
  });
};

export default errorHandler;