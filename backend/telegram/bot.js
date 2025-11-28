/**
 * Telegram Bot
 * 
 * Handles Telegram interactions for news verification.
 * Supports both polling and webhook modes.
 */

const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');
const handlers = require('./handlers');

class TelegramBot {
  constructor() {
    this.bot = null;
    this.initialized = false;
    this.mode = process.env.TELEGRAM_MODE || 'polling';
  }

  /**
   * Initialize the Telegram bot
   */
  async initialize() {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      logger.warn('Telegram bot token not configured, skipping initialization');
      return;
    }

    try {
      this.bot = new Telegraf(token);

      // Register handlers
      this.registerHandlers();

      // Set up error handling
      this.bot.catch((err, ctx) => {
        logger.error('Telegram bot error', {
          error: err.message,
          updateType: ctx.updateType
        });
      });

      // Start polling if not using webhook
      if (this.mode === 'polling') {
        await this.bot.launch();
        logger.info('Telegram bot started in polling mode');
      } else {
        // Set webhook
        const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
        if (webhookUrl) {
          await this.bot.telegram.setWebhook(webhookUrl);
          logger.info('Telegram webhook set', { url: webhookUrl });
        }
      }

      this.initialized = true;
      logger.bot('telegram', 'Bot initialized', { mode: this.mode });
    } catch (error) {
      logger.error('Failed to initialize Telegram bot', { error: error.message });
      throw error;
    }
  }

  /**
   * Register message and command handlers
   */
  registerHandlers() {
    // Start command
    this.bot.start(handlers.handleStart);

    // Help command
    this.bot.help(handlers.handleHelp);

    // Verify command
    this.bot.command('verify', handlers.handleVerify);

    // Status command
    this.bot.command('status', handlers.handleStatus);

    // Handle URLs sent directly
    this.bot.on('text', handlers.handleText);

    // Handle inline queries
    this.bot.on('inline_query', handlers.handleInlineQuery);
  }

  /**
   * Handle webhook update
   * @param {Object} update - Telegram update object
   */
  async handleWebhook(update) {
    if (!this.bot) {
      logger.warn('Telegram bot not initialized');
      return;
    }

    await this.bot.handleUpdate(update);
  }

  /**
   * Send verification result to a chat
   * @param {number} chatId - Telegram chat ID
   * @param {Object} result - Verification result
   */
  async sendVerificationResult(chatId, result) {
    if (!this.bot) return;

    const verdictEmoji = {
      true: '✅',
      false: '❌',
      mixed: '⚠️',
      unknown: '❓'
    };

    const message = `
${verdictEmoji[result.verdict] || '❓'} *Verification Result*

*Verdict:* ${result.verdict.toUpperCase()}
*Accuracy Score:* ${result.accuracy_score}/100

*Summary:*
${result.agent_reports?.[0]?.summary || 'No summary available'}

*Blockchain Hash:*
\`${result.blockchain_hash?.substring(0, 20)}...\`

[View Full Report](${process.env.BASE_URL}/verify/${result.source_graph?.hash})
    `.trim();

    await this.bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  }

  /**
   * Graceful shutdown
   */
  async stop() {
    if (this.bot && this.mode === 'polling') {
      this.bot.stop('SIGTERM');
      logger.info('Telegram bot stopped');
    }
  }
}

// Export singleton instance
module.exports = new TelegramBot();

