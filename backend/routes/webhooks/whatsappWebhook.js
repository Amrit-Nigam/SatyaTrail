/**
 * WhatsApp Webhook Route (Twilio)
 *
 * Receives WhatsApp messages from Twilio and forwards them
 * to the WhatsApp bot handler.
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

// Log when this route module is loaded
console.log('[WhatsApp] Webhook route module loaded');

// Lazy load WhatsApp bot to avoid circular dependencies
let whatsappBot = null;

const getWhatsAppBot = () => {
  if (!whatsappBot) {
    try {
      whatsappBot = require('../../whatsapp/bot');
    } catch (error) {
      logger.error('Failed to load WhatsApp bot', { error: error.message });
      return null;
    }
  }
  return whatsappBot;
};

/**
 * POST /api/v1/webhook/whatsapp
 * Twilio will send incoming WhatsApp messages here.
 */
router.post('/', async (req, res) => {
  const params = req.body || {};

  logger.bot('whatsapp', 'Webhook HTTP request received', {
    from: params.From,
    to: params.To,
  });

  try {
    const bot = getWhatsAppBot();

    if (!bot) {
      logger.warn('WhatsApp bot not available');
      return res.sendStatus(200);
    }

    await bot.handleWebhook(req, res);
  } catch (error) {
    logger.error('WhatsApp webhook error', {
      error: error.message,
      stack: error.stack,
    });

    // Twilio expects a 200 with valid TwiML; delegate to bot handler fallback
    try {
      const twilio = require('twilio');
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(
        '❌ Sorry, something went wrong while processing your request.',
      );
      res.type('text/xml').send(twiml.toString());
    } catch {
      res.sendStatus(200);
    }
  }
});

module.exports = router;


