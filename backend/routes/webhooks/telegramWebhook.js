/**
 * Telegram Webhook Route
 * 
 * Receives Telegram updates when using webhook mode.
 * Handles message routing to the Telegram bot handler.
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

// Lazy load the telegram bot to avoid circular dependencies
let telegramBot = null;

/**
 * Get or initialize the Telegram bot instance
 */
const getTelegramBot = () => {
  if (!telegramBot) {
    try {
      telegramBot = require('../../telegram/bot');
    } catch (error) {
      logger.error('Failed to load Telegram bot', { error: error.message });
      return null;
    }
  }
  return telegramBot;
};

/**
 * Validate webhook secret token (optional security)
 * Set TELEGRAM_WEBHOOK_SECRET in .env to enable
 */
const validateWebhookSecret = (req) => {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  
  // If no secret configured, skip validation
  if (!webhookSecret) return true;
  
  // Telegram sends the secret in X-Telegram-Bot-Api-Secret-Token header
  const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
  
  return receivedSecret === webhookSecret;
};

/**
 * POST /api/v1/webhook/telegram
 * Receives and processes Telegram updates
 * 
 * Update types:
 * - message: New incoming message
 * - edited_message: Edited message
 * - channel_post: New post in a channel
 * - inline_query: Inline query
 * - callback_query: Callback from inline keyboard
 * - chosen_inline_result: Result of inline query chosen by user
 */
router.post('/', async (req, res) => {
  const update = req.body;
  const updateId = update?.update_id;
  
  // Determine update type for logging
  const updateType = update?.message ? 'message' :
                     update?.edited_message ? 'edited_message' :
                     update?.channel_post ? 'channel_post' :
                     update?.inline_query ? 'inline_query' :
                     update?.callback_query ? 'callback_query' :
                     update?.chosen_inline_result ? 'chosen_inline_result' :
                     'unknown';

  logger.bot('telegram', 'Webhook update received', {
    updateId,
    updateType,
    chatId: update?.message?.chat?.id || update?.callback_query?.message?.chat?.id,
    userId: update?.message?.from?.id || update?.inline_query?.from?.id,
    hasText: !!update?.message?.text
  });

  // Validate webhook secret if configured
  if (!validateWebhookSecret(req)) {
    logger.warn('Telegram webhook: Invalid secret token');
    // Return 200 anyway to not reveal validation failure to attackers
    return res.sendStatus(200);
  }

  try {
    // Get the telegram bot instance
    const bot = getTelegramBot();
    
    if (!bot) {
      logger.warn('Telegram bot not available');
      return res.sendStatus(200);
    }

    // Check if bot is initialized
    if (!bot.initialized) {
      logger.warn('Telegram bot not initialized, attempting to process anyway');
    }
    
    // Process the update
    await bot.handleWebhook(update);
    
    logger.bot('telegram', 'Update processed successfully', { updateId, updateType });
    
    // Telegram expects a 200 response
    res.sendStatus(200);
  } catch (error) {
    logger.error('Telegram webhook processing error', { 
      error: error.message,
      stack: error.stack,
      updateId,
      updateType
    });
    
    // Still return 200 to prevent Telegram from retrying failed updates
    // Telegram will retry if it receives anything other than 200
    res.sendStatus(200);
  }
});

/**
 * GET /api/v1/webhook/telegram
 * Webhook status and verification endpoint
 */
router.get('/', (req, res) => {
  const bot = getTelegramBot();
  
  res.json({
    status: 'active',
    platform: 'telegram',
    mode: process.env.TELEGRAM_MODE || 'polling',
    botInitialized: bot?.initialized || false,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL ? 'configured' : 'not configured',
    secretConfigured: !!process.env.TELEGRAM_WEBHOOK_SECRET,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/webhook/telegram/status
 * Detailed bot status
 */
router.get('/status', async (req, res) => {
  const bot = getTelegramBot();
  
  if (!bot || !bot.bot) {
    return res.json({
      status: 'offline',
      message: 'Telegram bot not initialized',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Get bot info from Telegram API
    const botInfo = await bot.bot.telegram.getMe();
    
    res.json({
      status: 'online',
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        firstName: botInfo.first_name,
        canJoinGroups: botInfo.can_join_groups,
        canReadGroupMessages: botInfo.can_read_all_group_messages,
        supportsInlineQueries: botInfo.supports_inline_queries
      },
      mode: process.env.TELEGRAM_MODE || 'polling',
      initialized: bot.initialized,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: error.message,
      initialized: bot.initialized,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/v1/webhook/telegram/set
 * Set webhook URL (admin endpoint - should be protected)
 */
router.post('/set', async (req, res) => {
  const { url, secret } = req.body;
  const bot = getTelegramBot();
  
  if (!bot || !bot.bot) {
    return res.status(503).json({
      error: 'Bot Unavailable',
      message: 'Telegram bot not initialized',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Set webhook with optional secret token
    const options = {};
    if (secret) {
      options.secret_token = secret;
    }
    
    await bot.bot.telegram.setWebhook(url, options);
    
    logger.info('Telegram webhook set', { url, hasSecret: !!secret });
    
    res.json({
      success: true,
      message: 'Webhook URL set successfully',
      url,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to set Telegram webhook', { error: error.message });
    res.status(500).json({
      error: 'Failed to set webhook',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/v1/webhook/telegram
 * Remove webhook and switch to polling mode
 */
router.delete('/', async (req, res) => {
  const bot = getTelegramBot();
  
  if (!bot || !bot.bot) {
    return res.status(503).json({
      error: 'Bot Unavailable',
      message: 'Telegram bot not initialized',
      timestamp: new Date().toISOString()
    });
  }

  try {
    await bot.bot.telegram.deleteWebhook();
    
    logger.info('Telegram webhook deleted');
    
    res.json({
      success: true,
      message: 'Webhook deleted. Use polling mode or set a new webhook.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to delete Telegram webhook', { error: error.message });
    res.status(500).json({
      error: 'Failed to delete webhook',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/webhook/telegram/info
 * Get current webhook info
 */
router.get('/info', async (req, res) => {
  const bot = getTelegramBot();
  
  if (!bot || !bot.bot) {
    return res.status(503).json({
      error: 'Bot Unavailable',
      message: 'Telegram bot not initialized',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const webhookInfo = await bot.bot.telegram.getWebhookInfo();
    
    res.json({
      url: webhookInfo.url || null,
      hasCustomCertificate: webhookInfo.has_custom_certificate,
      pendingUpdateCount: webhookInfo.pending_update_count,
      ipAddress: webhookInfo.ip_address,
      lastErrorDate: webhookInfo.last_error_date ? 
        new Date(webhookInfo.last_error_date * 1000).toISOString() : null,
      lastErrorMessage: webhookInfo.last_error_message,
      lastSynchronizationErrorDate: webhookInfo.last_synchronization_error_date ?
        new Date(webhookInfo.last_synchronization_error_date * 1000).toISOString() : null,
      maxConnections: webhookInfo.max_connections,
      allowedUpdates: webhookInfo.allowed_updates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get webhook info', { error: error.message });
    res.status(500).json({
      error: 'Failed to get webhook info',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
