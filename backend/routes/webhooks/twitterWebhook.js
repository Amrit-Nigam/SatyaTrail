/**
 * Twitter Webhook Route
 * 
 * Receives Twitter Account Activity API events.
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const logger = require('../../utils/logger');

/**
 * GET /api/v1/webhook/twitter
 * CRC validation for Twitter webhook
 */
router.get('/', (req, res) => {
  const { crc_token } = req.query;

  if (!crc_token) {
    return res.status(400).json({
      error: 'Missing crc_token'
    });
  }

  // Create HMAC SHA-256 hash
  const consumerSecret = process.env.TWITTER_API_SECRET;
  
  if (!consumerSecret) {
    logger.error('Twitter API secret not configured');
    return res.status(500).json({
      error: 'Configuration error'
    });
  }

  const hmac = crypto.createHmac('sha256', consumerSecret);
  hmac.update(crc_token);
  const responseToken = 'sha256=' + hmac.digest('base64');

  logger.bot('twitter', 'CRC validation', { success: true });

  res.json({
    response_token: responseToken
  });
});

/**
 * POST /api/v1/webhook/twitter
 * Receives Twitter events (mentions, DMs, etc.)
 */
router.post('/', async (req, res) => {
  logger.bot('twitter', 'Webhook received', {
    eventTypes: Object.keys(req.body || {})
  });

  try {
    // Get the twitter bot instance
    const twitterBot = require('../../twitter/bot');
    
    // Process the event
    await twitterBot.handleWebhook(req.body);
    
    res.sendStatus(200);
  } catch (error) {
    logger.error('Twitter webhook error', { error: error.message });
    res.sendStatus(200);
  }
});

/**
 * GET /api/v1/webhook/twitter/status
 * Check Twitter bot status
 */
router.get('/status', (req, res) => {
  try {
    const twitterBot = require('../../twitter/bot');
    
    res.json({
      status: twitterBot.initialized ? 'initialized' : 'not_initialized',
      operational: twitterBot.isOperational(),
      authMethod: twitterBot.authMethod || 'none',
      botUserId: twitterBot.botUserId || null,
      hasClient: !!twitterBot.client,
      hasStreamClient: !!twitterBot.streamClient,
      usePolling: process.env.TWITTER_USE_POLLING === 'true',
      webhookUrl: process.env.TWITTER_WEBHOOK_URL || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

