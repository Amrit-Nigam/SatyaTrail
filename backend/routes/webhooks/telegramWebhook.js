/**
 * Telegram Webhook Route
 * 
 * Receives Telegram updates when using webhook mode.
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

/**
 * POST /api/v1/webhook/telegram
 * Receives Telegram updates
 */
router.post('/', async (req, res) => {
  logger.bot('telegram', 'Webhook received', {
    updateId: req.body?.update_id
  });

  try {
    // Get the telegram bot instance
    const telegramBot = require('../../telegram/bot');
    
    // Process the update
    await telegramBot.handleWebhook(req.body);
    
    // Telegram expects a 200 response
    res.sendStatus(200);
  } catch (error) {
    logger.error('Telegram webhook error', { error: error.message });
    // Still return 200 to prevent Telegram from retrying
    res.sendStatus(200);
  }
});

/**
 * GET /api/v1/webhook/telegram
 * Webhook verification (some setups require this)
 */
router.get('/', (req, res) => {
  res.json({
    status: 'active',
    platform: 'telegram',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

