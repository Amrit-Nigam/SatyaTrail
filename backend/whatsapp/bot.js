/**
 * WhatsApp Bot (Twilio)
 *
 * Handles WhatsApp interactions for news verification using Twilio webhooks.
 */

const logger = require('../utils/logger');
const { handleIncomingMessage } = require('./handlers');
const twilio = require('twilio');

console.log('[WhatsApp] Bot module loading...');

class WhatsAppBot {
  constructor() {
    console.log('[WhatsApp] Initializing WhatsApp bot...');
    
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || null;
    this.authToken = process.env.TWILIO_AUTH_TOKEN || null;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || null;

    console.log('[WhatsApp] Config check:', {
      hasAccountSid: !!this.accountSid,
      hasAuthToken: !!this.authToken,
      whatsappNumber: this.whatsappNumber || 'NOT SET',
    });

    // Twilio REST client for sending WhatsApp messages
    this.client =
      this.accountSid && this.authToken
        ? twilio(this.accountSid, this.authToken)
        : null;

    if (this.client) {
      console.log('[WhatsApp] ✅ Twilio client initialized successfully');
    } else {
      console.log('[WhatsApp] ⚠️ Twilio client NOT initialized (missing credentials)');
    }

    logger.info('WhatsApp bot initialized (Twilio)', {
      hasAccountSid: !!this.accountSid,
      hasAuthToken: !!this.authToken,
      whatsappNumber: this.whatsappNumber,
    });
  }

  /**
   * Handle incoming Twilio webhook for WhatsApp.
   * Uses Twilio REST API (Messages.create) to send the reply,
   * equivalent to the example curl:
   * curl https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json ...
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async handleWebhook(req, res) {
    try {
      const params = req.body || {};

      // Basic console log for quick debugging in local dev
      // (safe subset of fields, no sensitive data)
      console.log('[WhatsApp] Incoming webhook:', {
        from: params.From,
        to: params.To,
        bodyPreview: (params.Body || '').substring(0, 80),
      });

      logger.bot('whatsapp', 'Webhook update received', {
        from: params.From,
        to: params.To,
        bodyLength: (params.Body || '').length,
      });

      const replyText = await handleIncomingMessage(params);

      // If Twilio client or WhatsApp number is not configured, fallback to TwiML response
      if (!this.client || !this.whatsappNumber) {
        logger.warn('Twilio client or WhatsApp number not configured, using TwiML fallback');
        console.log('[WhatsApp] Using TwiML fallback response');
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(replyText);
        return res.type('text/xml').send(twiml.toString());
      }

      const to = params.From; // e.g., 'whatsapp:+9193...'
      const from =
        this.whatsappNumber.startsWith('whatsapp:')
          ? this.whatsappNumber
          : `whatsapp:${this.whatsappNumber}`;

      // Use Twilio REST API to send the WhatsApp message (matches example curl semantics)
      await this.client.messages.create({
        to,
        from,
        body: replyText,
      });

      logger.bot('whatsapp', 'Reply sent via Twilio REST API', {
        to,
        from,
        replyPreview: replyText.substring(0, 120),
      });

      // Acknowledge webhook
      res.status(200).send('OK');
    } catch (error) {
      logger.error('WhatsApp webhook processing error', {
        error: error.message,
        stack: error.stack,
      });

      // On error, still return a basic TwiML to acknowledge the webhook
      try {
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(
          '❌ Sorry, something went wrong while processing your request.',
        );
        res.type('text/xml').send(twiml.toString());
      } catch {
        res.status(200).send('OK');
      }
    }
  }
}

// Export singleton instance
const whatsappBotInstance = new WhatsAppBot();
console.log('[WhatsApp] Bot instance created and exported');
module.exports = whatsappBotInstance;


