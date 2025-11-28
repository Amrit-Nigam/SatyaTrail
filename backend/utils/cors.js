/**
 * CORS Middleware
 * 
 * Configured based on @prompt.json frontend origins.
 */

const cors = require('cors');
const logger = require('./logger');

// Parse allowed origins from environment
const getAllowedOrigins = () => {
  const originsEnv = process.env.CORS_ORIGINS || '';
  const origins = originsEnv.split(',').map(o => o.trim()).filter(Boolean);
  
  // Always allow localhost for development
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:5173');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://127.0.0.1:5173');
  }
  
  return origins;
};

const allowedOrigins = getAllowedOrigins();

logger.info('CORS configured', { allowedOrigins });

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow any localhost
    if (process.env.NODE_ENV !== 'production' && 
        (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    
    // Log rejected origin
    logger.warn('CORS blocked', { origin, allowedOrigins });
    
    callback(new Error('Not allowed by CORS'));
  },
  
  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Api-Key'
  ],
  
  // Expose headers to client
  exposedHeaders: [
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Cache preflight requests
  maxAge: 86400, // 24 hours
  
  // Success status for legacy browsers
  optionsSuccessStatus: 200
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;

