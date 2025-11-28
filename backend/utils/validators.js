/**
 * Validators Utility
 * 
 * Input validation and sanitization for API requests.
 */

const { body, query, param, validationResult } = require('express-validator');

/**
 * Validate verification request body
 */
const verifyRequestValidation = [
  body('url')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid URL format'),
  
  body('text')
    .optional()
    .isString()
    .isLength({ min: 10, max: 50000 })
    .withMessage('Text must be between 10 and 50000 characters')
    .trim()
    .escape(),
  
  body('source')
    .optional()
    .isIn(['frontend', 'telegram', 'twitter', 'extension'])
    .withMessage('Invalid source. Must be: frontend, telegram, twitter, or extension'),

  // Custom validation: at least one of url or text must be provided
  body()
    .custom((value) => {
      if (!value.url && !value.text) {
        throw new Error('Either url or text must be provided');
      }
      return true;
    })
];

/**
 * Validate extension request (optimized for quick response)
 */
const extensionRequestValidation = [
  body('url')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid URL format'),
  
  body('text')
    .optional()
    .isString()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Text must be between 10 and 10000 characters')
    .trim()
    .escape(),

  body()
    .custom((value) => {
      if (!value.url && !value.text) {
        throw new Error('Either url or text must be provided');
      }
      return true;
    })
];

/**
 * Validate webhook requests
 */
const webhookValidation = [
  body()
    .isObject()
    .withMessage('Request body must be an object')
];

/**
 * Validate graph hash parameter
 */
const graphHashValidation = [
  param('hash')
    .isString()
    .isLength({ min: 64, max: 64 })
    .matches(/^[a-f0-9]+$/i)
    .withMessage('Invalid graph hash format')
];

/**
 * Validate pagination parameters
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Middleware to check validation results
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request parameters',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Sanitize HTML/script content
 */
const sanitizeContent = (text) => {
  if (!text) return text;
  
  // Remove script tags
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  text = text.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Basic HTML entity encoding for dangerous characters
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return text;
};

/**
 * Validate URL is not malicious
 */
const isValidNewsUrl = (url) => {
  try {
    const parsed = new URL(url);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return false;
    }
    
    // Block file extensions that aren't web pages
    const dangerousExtensions = ['.exe', '.bat', '.sh', '.cmd', '.msi', '.dmg'];
    if (dangerousExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Rate limiter configuration by endpoint type
 */
const rateLimitConfig = {
  verify: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
    message: 'Too many verification requests, please try again later'
  },
  extension: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Extension rate limit exceeded'
  },
  webhook: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 webhook calls per minute
    message: 'Webhook rate limit exceeded'
  }
};

module.exports = {
  verifyRequestValidation,
  extensionRequestValidation,
  webhookValidation,
  graphHashValidation,
  paginationValidation,
  validateRequest,
  sanitizeContent,
  isValidNewsUrl,
  rateLimitConfig
};

