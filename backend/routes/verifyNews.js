/**
 * Verify News Routes
 * 
 * Main verification API endpoints.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const verifyController = require('../controllers/verifyController');
const {
  verifyRequestValidation,
  graphHashValidation,
  paginationValidation,
  validateRequest,
  rateLimitConfig
} = require('../utils/validators');

// Rate limiting for verification endpoint
const verifyLimiter = rateLimit({
  windowMs: rateLimitConfig.verify.windowMs,
  max: rateLimitConfig.verify.max,
  message: {
    error: 'Rate Limit Exceeded',
    message: rateLimitConfig.verify.message,
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/v1/verify
 * Main verification endpoint
 * 
 * Request body: { url?: string, text?: string, source?: string }
 * Response: VerificationResult
 */
router.post(
  '/',
  verifyLimiter,
  verifyRequestValidation,
  validateRequest,
  verifyController.verify.bind(verifyController)
);

/**
 * GET /api/v1/verify/recent
 * Get recent verifications
 * 
 * Query params: { limit?: number }
 * Response: { verifications: VerificationSummary[], count: number }
 */
router.get(
  '/recent',
  paginationValidation,
  validateRequest,
  verifyController.getRecent.bind(verifyController)
);

/**
 * GET /api/v1/verify/stats
 * Get verification statistics
 * 
 * Response: { bySource: Object }
 */
router.get(
  '/stats',
  verifyController.getStats.bind(verifyController)
);

/**
 * GET /api/v1/verify/:hash
 * Get verification by graph hash
 * 
 * Response: VerificationResult
 */
router.get(
  '/:hash',
  graphHashValidation,
  validateRequest,
  verifyController.getByHash.bind(verifyController)
);

module.exports = router;

