/**
 * Twitter/X Bot
 * 
 * Monitors mentions and triggers verification pipeline.
 * Uses Twitter API v2.
 */

const { TwitterApi } = require('twitter-api-v2');
const logger = require('../utils/logger');
const handlers = require('./handlers');

class TwitterBot {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.botUserId = null;
    this.streamClient = null;
  }

  /**
   * Initialize the Twitter bot
   */
  async initialize() {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken && !apiKey) {
      logger.warn('Twitter credentials not configured, skipping initialization');
      return;
    }

    try {
      // Create client with OAuth 1.0a for tweeting
      if (apiKey && accessToken) {
        this.client = new TwitterApi({
          appKey: apiKey,
          appSecret: apiSecret,
          accessToken: accessToken,
          accessSecret: accessSecret
        });

        // Get bot user ID
        const me = await this.client.v2.me();
        this.botUserId = me.data.id;
        logger.info('Twitter bot authenticated', { userId: this.botUserId, username: me.data.username });
      }

      // Create read-only client with bearer token for streaming
      if (bearerToken) {
        this.streamClient = new TwitterApi(bearerToken);
        
        // Start monitoring mentions (if not using webhook)
        if (process.env.TWITTER_USE_POLLING === 'true') {
          this.startMentionPolling();
        }
      }

      this.initialized = true;
      logger.bot('twitter', 'Bot initialized');
    } catch (error) {
      logger.error('Failed to initialize Twitter bot', { error: error.message });
      // Don't throw - allow app to continue without Twitter
    }
  }

  /**
   * Start polling for mentions
   */
  async startMentionPolling() {
    logger.info('Starting Twitter mention polling');
    
    let sinceId = null;

    const pollMentions = async () => {
      try {
        if (!this.streamClient || !this.botUserId) return;

        const params = {
          'tweet.fields': ['author_id', 'created_at', 'text', 'entities'],
          max_results: 10
        };

        if (sinceId) {
          params.since_id = sinceId;
        }

        const mentions = await this.streamClient.v2.userMentionTimeline(
          this.botUserId,
          params
        );

        if (mentions.data?.data?.length > 0) {
          sinceId = mentions.data.meta.newest_id;
          
          for (const tweet of mentions.data.data) {
            await handlers.handleMention(this, tweet);
          }
        }
      } catch (error) {
        logger.error('Twitter polling error', { error: error.message });
      }
    };

    // Poll every 60 seconds (respecting rate limits)
    setInterval(pollMentions, 60000);
    pollMentions(); // Initial poll
  }

  /**
   * Handle webhook events
   * @param {Object} body - Webhook payload
   */
  async handleWebhook(body) {
    logger.bot('twitter', 'Processing webhook', { eventTypes: Object.keys(body) });

    try {
      // Handle tweet create events (mentions)
      if (body.tweet_create_events) {
        for (const tweet of body.tweet_create_events) {
          // Ignore own tweets
          if (tweet.user?.id_str === this.botUserId) continue;
          
          await handlers.handleMention(this, {
            id: tweet.id_str,
            text: tweet.text,
            author_id: tweet.user?.id_str,
            entities: tweet.entities
          });
        }
      }

      // Handle direct messages
      if (body.direct_message_events) {
        for (const dm of body.direct_message_events) {
          if (dm.type === 'message_create') {
            await handlers.handleDirectMessage(this, dm.message_create);
          }
        }
      }
    } catch (error) {
      logger.error('Twitter webhook processing error', { error: error.message });
    }
  }

  /**
   * Reply to a tweet
   * @param {string} tweetId - Tweet ID to reply to
   * @param {string} text - Reply text
   */
  async reply(tweetId, text) {
    if (!this.client) {
      logger.warn('Twitter client not available for replying');
      return null;
    }

    try {
      // Ensure text is within limit (280 chars)
      const truncatedText = text.length > 280 
        ? text.substring(0, 277) + '...'
        : text;

      const response = await this.client.v2.reply(truncatedText, tweetId);
      
      logger.bot('twitter', 'Reply sent', { 
        replyTo: tweetId, 
        tweetId: response.data.id 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send Twitter reply', { 
        tweetId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Send a direct message
   * @param {string} userId - User ID to message
   * @param {string} text - Message text
   */
  async sendDM(userId, text) {
    if (!this.client) {
      logger.warn('Twitter client not available for DMs');
      return null;
    }

    try {
      const response = await this.client.v2.sendDmToParticipant(userId, {
        text
      });
      
      logger.bot('twitter', 'DM sent', { userId });
      return response;
    } catch (error) {
      logger.error('Failed to send Twitter DM', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if bot is operational
   */
  isOperational() {
    return this.initialized && this.client !== null;
  }
}

// Export singleton instance
module.exports = new TwitterBot();

