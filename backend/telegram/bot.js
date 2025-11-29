/**
 * Telegram Bot
 * 
 * Handles Telegram interactions for news verification.
 * Supports both polling (development) and webhook (production) modes.
 * 
 * Usage:
 * - Polling mode: Set TELEGRAM_MODE=polling (default)
 * - Webhook mode: Set TELEGRAM_MODE=webhook and TELEGRAM_WEBHOOK_URL
 */

const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');
const handlers = require('./handlers');

class TelegramBot {
  constructor() {
    this.bot = null;
    this.initialized = false;
    this.mode = process.env.TELEGRAM_MODE || 'polling';
    this.botInfo = null;
  }

  /**
   * Initialize the Telegram bot
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      logger.warn('Telegram bot token not configured, skipping initialization');
      return false;
    }

    try {
      // Create bot instance with options
      this.bot = new Telegraf(token, {
        telegram: {
          // Webhook mode settings
          webhookReply: this.mode === 'webhook'
        },
        handlerTimeout: 60000 // 60 second timeout for handlers
      });

      // Get bot info first to verify token is valid
      this.botInfo = await this.bot.telegram.getMe();
      logger.info('Telegram bot connected', {
        botId: this.botInfo.id,
        username: this.botInfo.username,
        firstName: this.botInfo.first_name,
        canJoinGroups: this.botInfo.can_join_groups,
        canReadAllGroupMessages: this.botInfo.can_read_all_group_messages
      });
      
      // Store bot info in context for handlers
      this.bot.context.botInfo = this.botInfo;

      // Register all handlers
      this.registerHandlers();

      // Set up error handling
      this.bot.catch((err, ctx) => {
        logger.error('Telegram bot error', {
          error: err.message,
          stack: err.stack,
          updateType: ctx.updateType,
          chatId: ctx.chat?.id,
          userId: ctx.from?.id
        });
      });

      // Start based on mode
      if (this.mode === 'polling') {
        await this.startPolling();
      } else if (this.mode === 'webhook') {
        await this.setupWebhook();
      }

      this.initialized = true;
      logger.bot('telegram', 'Bot initialized successfully', { 
        mode: this.mode,
        username: this.botInfo.username
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize Telegram bot', { 
        error: error.message,
        stack: error.stack
      });
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Start polling mode (for development)
   */
  async startPolling() {
    try {
      // Delete any existing webhook first
      await this.bot.telegram.deleteWebhook({ drop_pending_updates: false });
      
      // Start polling
      await this.bot.launch({
        dropPendingUpdates: false
      });
      
      logger.info('Telegram bot started in polling mode');
    } catch (error) {
      logger.error('Failed to start polling', { error: error.message });
      throw error;
    }
  }

  /**
   * Set up webhook mode (for production)
   */
  async setupWebhook() {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!webhookUrl) {
      logger.warn('TELEGRAM_WEBHOOK_URL not configured, webhook mode disabled');
      logger.info('Falling back to polling mode');
      this.mode = 'polling';
      return this.startPolling();
    }

    try {
      const webhookOptions = {
        drop_pending_updates: false
      };

      // Add secret token if configured
      if (webhookSecret) {
        webhookOptions.secret_token = webhookSecret;
      }

      await this.bot.telegram.setWebhook(webhookUrl, webhookOptions);
      
      // Verify webhook was set
      const webhookInfo = await this.bot.telegram.getWebhookInfo();
      
      logger.info('Telegram webhook configured', { 
        url: webhookInfo.url,
        pendingUpdates: webhookInfo.pending_update_count,
        hasSecret: !!webhookSecret
      });
    } catch (error) {
      logger.error('Failed to set webhook', { error: error.message });
      throw error;
    }
  }

  /**
   * Register all message and command handlers
   */
  registerHandlers() {
    // Middleware for logging all updates and adding bot info
    this.bot.use(async (ctx, next) => {
      // Add bot info to context for handlers (ensure it's always available)
      if (!ctx.botInfo) {
        ctx.botInfo = this.botInfo;
      }
      
      // Also add to ctx.telegram context if needed
      if (this.botInfo && !ctx.telegram.botInfo) {
        ctx.telegram.botInfo = this.botInfo;
      }
      
      const start = Date.now();
      await next();
      const responseTime = Date.now() - start;
      
      logger.bot('telegram', 'Update processed', {
        updateType: ctx.updateType,
        responseTime: `${responseTime}ms`,
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        chatType: ctx.chat?.type,
        hasBotInfo: !!ctx.botInfo,
        botUsername: ctx.botInfo?.username
      });
    });

    // Command handlers
    this.bot.start(handlers.handleStart);
    this.bot.help(handlers.handleHelp);
    this.bot.command('verify', handlers.handleVerify);
    this.bot.command('status', handlers.handleStatus);

    // Handle mentions in groups - use hears with regex to catch @bot mentions
    if (this.botInfo?.username) {
      const mentionPattern = new RegExp(`@${this.botInfo.username}`, 'i');
      this.bot.hears(mentionPattern, handlers.handleMention);
      
      logger.info('Registered mention handler', { 
        username: this.botInfo.username,
        pattern: mentionPattern.toString()
      });
    }

    // Handle regular text messages (this will also catch mentions but handleMention takes priority)
    this.bot.on('text', handlers.handleText);

    // Handle inline queries
    this.bot.on('inline_query', handlers.handleInlineQuery);

    // Handle callback queries (for inline keyboards)
    this.bot.on('callback_query', async (ctx) => {
      try {
        await ctx.answerCbQuery();
        const data = ctx.callbackQuery.data;
        
        logger.bot('telegram', 'Callback query', { 
          data,
          userId: ctx.from?.id 
        });
        
        // Handle different callback actions
        if (data.startsWith('verify:')) {
          const content = data.replace('verify:', '');
          await handlers.handleVerify({
            ...ctx,
            message: { ...ctx.message, text: `/verify ${content}` }
          });
        }
      } catch (error) {
        logger.error('Callback query error', { error: error.message });
      }
    });

    // Handle photos with captions (can contain URLs)
    this.bot.on('photo', async (ctx) => {
      const caption = ctx.message.caption;
      if (caption && (caption.includes('http') || caption.length > 20)) {
        await handlers.handleText({
          ...ctx,
          message: { ...ctx.message, text: caption }
        });
      }
    });

    logger.info('Telegram handlers registered');
  }

  /**
   * Handle incoming webhook update
   * @param {Object} update - Telegram update object
   */
  async handleWebhook(update) {
    if (!this.bot) {
      logger.warn('Telegram bot not initialized, cannot process webhook');
      return;
    }

    try {
      await this.bot.handleUpdate(update);
    } catch (error) {
      logger.error('Error processing webhook update', {
        error: error.message,
        updateId: update?.update_id
      });
      throw error;
    }
  }

  /**
   * Send a message to a specific chat
   * @param {number|string} chatId - Telegram chat ID
   * @param {string} message - Message to send
   * @param {Object} options - Telegram message options
   */
  async sendMessage(chatId, message, options = {}) {
    if (!this.bot) {
      logger.warn('Cannot send message: bot not initialized');
      return null;
    }

    try {
      const result = await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      });
      return result;
    } catch (error) {
      logger.error('Failed to send Telegram message', {
        chatId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send verification result to a chat
   * @param {number} chatId - Telegram chat ID
   * @param {Object} result - Verification result
   */
  async sendVerificationResult(chatId, result) {
    if (!this.bot) {
      logger.warn('Cannot send verification result: bot not initialized');
      return;
    }

    const verdictEmoji = {
      true: '✅',
      false: '❌',
      mixed: '⚠️',
      unknown: '❓'
    };

    const emoji = verdictEmoji[result.verdict] || '❓';
    const accuracyBar = this.createProgressBar(result.accuracy_score);

    const message = `
${emoji} *Verification Result*

*Verdict:* ${result.verdict.toUpperCase()}
*Accuracy:* ${accuracyBar} ${result.accuracy_score}/100

📝 *Summary:*
${result.agent_reports?.[0]?.summary?.substring(0, 400) || 'Analysis complete.'}

🔗 *Blockchain Proof:*
${result.blockchain_hash ? `https://sepolia.etherscan.io/tx/${result.blockchain_hash}` : 'Pending'}
    `.trim();

    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      logger.error('Failed to send verification result', {
        chatId,
        error: error.message
      });
      
      // Try sending a simpler message without markdown
      await this.bot.telegram.sendMessage(chatId, 
        `Verification Result: ${result.verdict.toUpperCase()} (${result.accuracy_score}/100)`
      );
    }
  }

  /**
   * Create a text-based progress bar
   * @param {number} value - Value between 0-100
   */
  createProgressBar(value) {
    const filled = Math.round(value / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Get bot status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      mode: this.mode,
      botInfo: this.botInfo ? {
        id: this.botInfo.id,
        username: this.botInfo.username,
        firstName: this.botInfo.first_name
      } : null
    };
  }

  /**
   * Get bot instance for direct API access
   */
  getTelegram() {
    return this.bot?.telegram || null;
  }

  /**
   * Graceful shutdown
   */
  async stop() {
    if (this.bot) {
      if (this.mode === 'polling') {
        this.bot.stop('SIGTERM');
        logger.info('Telegram bot stopped (polling)');
      } else {
        // In webhook mode, we don't stop the bot, just log
        logger.info('Telegram bot shutdown (webhook mode - webhook remains active)');
      }
      this.initialized = false;
    }
  }
}

// Export singleton instance
module.exports = new TelegramBot();
