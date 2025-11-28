/**
 * Extension Routes
 * 
 * Optimized endpoints for browser extension.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const extensionController = require('../controllers/extensionController');
const {
  extensionRequestValidation,
  validateRequest,
  rateLimitConfig
} = require('../utils/validators');

// Rate limiting for extension endpoint (more permissive)
const extensionLimiter = rateLimit({
  windowMs: rateLimitConfig.extension.windowMs,
  max: rateLimitConfig.extension.max,
  message: {
    error: 'Rate Limit Exceeded',
    message: rateLimitConfig.extension.message,
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/v1/verify/extension
 * Extension verification endpoint (compact response)
 * 
 * Request body: { url?: string, text?: string }
 * Response: CompactVerificationResult
 */
router.post(
  '/',
  extensionLimiter,
  extensionRequestValidation,
  validateRequest,
  extensionController.verify.bind(extensionController)
);

/**
 * GET /api/v1/verify/extension/status
 * Extension status check
 * 
 * Response: { status: string, version: string }
 */
router.get(
  '/status',
  extensionController.status.bind(extensionController)
);

/**
 * GET /api/v1/verify/extension/check
 * Check if URL has been verified
 * 
 * Query: { url: string }
 * Response: { found: boolean, verdict?: string }
 */
router.get(
  '/check',
  extensionController.checkUrl.bind(extensionController)
);

module.exports = router;

