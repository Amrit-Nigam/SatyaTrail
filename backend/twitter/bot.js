/**
 * Twitter/X Bot
 * 
 * Monitors mentions and triggers verification pipeline.
 * Uses Twitter API v2 with OAuth 2.0 User Context.
 */

const { TwitterApi } = require('twitter-api-v2');
const logger = require('../utils/logger');
const handlers = require('./handlers');

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error.code === 429 || error.rateLimit || error.rateLimitError;
      const isServerError = error.code >= 500 || error.code === 503;
      
      // Only retry on rate limits or server errors
      if (!isRateLimit && !isServerError) {
        throw error;
      }
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt);
      const waitTime = error.rateLimit?.reset ? 
        (error.rateLimit.reset * 1000 - Date.now()) + 1000 : delay;
      
      logger.warn(`Twitter API error, retrying...`, {
        attempt: attempt + 1,
        maxRetries,
        waitTime: Math.round(waitTime / 1000),
        error: error.message,
        code: error.code
      });
      
      await sleep(Math.min(waitTime, 60000)); // Max 60 seconds
    }
  }
};

class TwitterBot {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.botUserId = null;
    this.streamClient = null;
    this.authMethod = null; // 'oauth2' or 'oauth1a'
  }

  /**
   * Initialize the Twitter bot with OAuth 2.0
   */
  async initialize() {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    const webhookUrl = process.env.TWITTER_WEBHOOK_URL;
    const usePolling = process.env.TWITTER_USE_POLLING === 'true' || (!webhookUrl && bearerToken);
    
    // OAuth 2.0 credentials
    const oauth2ClientId = process.env.TWITTER_OAUTH2_CLIENT_ID;
    const oauth2ClientSecret = process.env.TWITTER_OAUTH2_CLIENT_SECRET;
    const oauth2AccessToken = process.env.TWITTER_OAUTH2_ACCESS_TOKEN;

    if (!bearerToken && !apiKey) {
      logger.warn('Twitter credentials not configured, skipping initialization');
      return;
    }

    try {
      // Try OAuth 2.0 User Context first (preferred)
      if (oauth2AccessToken || (oauth2ClientId && oauth2ClientSecret)) {
        try {
          if (oauth2AccessToken) {
            // Use existing OAuth 2.0 access token
            this.client = new TwitterApi(oauth2AccessToken);
            this.authMethod = 'oauth2';
            logger.info('Using OAuth 2.0 User Context with access token');
          } else if (oauth2ClientId && oauth2ClientSecret) {
            // Note: For bots, you typically need to generate OAuth 2.0 token via PKCE flow
            // For now, we'll use OAuth 1.0a fallback
            logger.warn('OAuth 2.0 Client ID/Secret provided but access token not found. Using OAuth 1.0a fallback.');
            throw new Error('OAuth 2.0 token not available');
          }
          
          // Test OAuth 2.0 connection with retry
          try {
            const me = await retryWithBackoff(async () => {
              return await this.client.v2.me({
                'user.fields': ['username', 'id']
              });
            });
            
            this.botUserId = me.data.id;
            logger.info('Twitter bot authenticated with OAuth 2.0', { 
              userId: this.botUserId, 
              username: me.data.username,
              authMethod: 'OAuth 2.0'
            });
          } catch (authError) {
            logger.error('OAuth 2.0 authentication failed, falling back to OAuth 1.0a', { 
              error: authError.message,
              code: authError.code
            });
            throw authError;
          }
        } catch (oauth2Error) {
          // Fallback to OAuth 1.0a
          this.client = null;
          this.authMethod = null;
        }
      }
      
      // Fallback to OAuth 1.0a if OAuth 2.0 failed or not configured
      if (!this.client && apiKey && process.env.TWITTER_ACCESS_TOKEN) {
        try {
          const accessToken = process.env.TWITTER_ACCESS_TOKEN;
          const accessSecret = process.env.TWITTER_ACCESS_SECRET;
          
          this.client = new TwitterApi({
            appKey: apiKey,
            appSecret: apiSecret,
            accessToken: accessToken,
            accessSecret: accessSecret
          });
          this.authMethod = 'oauth1a';
          logger.info('Using OAuth 1.0a authentication');

          // Get bot user ID with retry
          try {
            const me = await retryWithBackoff(async () => {
              return await this.client.v2.me({
                'user.fields': ['username', 'id']
              });
            });
            
            this.botUserId = me.data.id;
            logger.info('Twitter bot authenticated with OAuth 1.0a', { 
              userId: this.botUserId, 
              username: me.data.username,
              authMethod: 'OAuth 1.0a'
            });
          } catch (authError) {
            logger.error('Failed to authenticate Twitter bot', { 
              error: authError.message,
              code: authError.code,
              rateLimit: authError.rateLimit
            });
            
            // If rate limited, wait and retry once
            if (authError.code === 429 || authError.rateLimit) {
              const resetTime = authError.rateLimit?.reset 
                ? authError.rateLimit.reset * 1000 - Date.now() 
                : 60000;
              logger.warn(`Rate limited. Waiting ${Math.round(resetTime / 1000)}s before retry...`);
              await sleep(Math.min(resetTime + 1000, 60000));
              
              try {
                const me = await this.client.v2.me();
                this.botUserId = me.data.id;
                logger.info('Twitter bot authenticated after rate limit wait', { 
                  userId: this.botUserId 
                });
              } catch (retryError) {
                logger.error('Authentication retry failed', { error: retryError.message });
              }
            }
          }
        } catch (error) {
          logger.error('Failed to create OAuth 1.0a client', { error: error.message });
        }
      }

      if (!this.client) {
        logger.warn('No Twitter client available - bot will not be able to reply');
      }

      // Create read-only client with bearer token for reading mentions
      if (bearerToken) {
        this.streamClient = new TwitterApi(bearerToken);
        logger.info('Twitter stream client created (OAuth 2.0 Bearer Token)');
        
        // Get botUserId from bearer token if not already set
        if (!this.botUserId) {
          try {
            logger.info('Attempting to get botUserId from bearer token...');
            // Note: Bearer token alone can't get user info, but we can try if we have client
            if (this.client) {
              const userInfo = await retryWithBackoff(async () => {
                return await this.client.v2.me();
              });
              this.botUserId = userInfo.data.id;
              logger.info('Got botUserId from authenticated client', { userId: this.botUserId });
            }
          } catch (error) {
            logger.warn('Cannot get botUserId', { 
              error: error.message,
              hint: 'Make sure OAuth 2.0 access token or OAuth 1.0a credentials are configured'
            });
          }
        }
        
        // Start monitoring mentions if using polling mode
        if (usePolling) {
          if (this.botUserId) {
            logger.info('Starting Twitter mention polling mode');
            // Add initial delay to avoid rate limits
            await sleep(2000);
            this.startMentionPolling();
          } else {
            logger.warn('Cannot start polling: botUserId unavailable');
            logger.info('Please configure OAuth 2.0 access token or OAuth 1.0a credentials');
          }
        } else {
          logger.info('Twitter webhook mode - polling disabled');
        }
      }

      this.initialized = true;
      logger.bot('twitter', 'Bot initialized', { 
        mode: usePolling ? 'polling' : 'webhook',
        authMethod: this.authMethod || 'none',
        canReply: !!this.client,
        canPoll: !!this.streamClient && !!this.botUserId,
        botUserId: this.botUserId
      });
    } catch (error) {
      logger.error('Failed to initialize Twitter bot', { 
        error: error.message,
        stack: error.stack
      });
      // Don't throw - allow app to continue without Twitter
    }
  }

  /**
   * Start polling for mentions
   */
  async startMentionPolling() {
    logger.info('Starting Twitter mention polling', { 
      botUserId: this.botUserId,
      pollInterval: '60 seconds',
      authMethod: this.authMethod
    });
    
    let sinceId = null;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5;

    const pollMentions = async () => {
      try {
        if (!this.streamClient) {
          logger.warn('Twitter stream client not available for polling');
          return;
        }

        if (!this.botUserId) {
          logger.warn('Twitter botUserId not available for polling');
          return;
        }

        const params = {
          'tweet.fields': ['author_id', 'created_at', 'text', 'entities', 'in_reply_to_user_id', 'conversation_id'],
          'user.fields': ['username'],
          expansions: ['author_id'],
          max_results: 10
        };

        if (sinceId) {
          params.since_id = sinceId;
        }

        logger.bot('twitter', 'Polling for mentions', { sinceId: sinceId || 'none' });

        // Use retry logic for API calls
        const mentions = await retryWithBackoff(async () => {
          return await this.streamClient.v2.userMentionTimeline(
            this.botUserId,
            params
          );
        }, 3, 2000);

        if (mentions.data?.data && mentions.data.data.length > 0) {
          logger.bot('twitter', 'Found mentions', { 
            count: mentions.data.data.length,
            newestId: mentions.data.meta?.newest_id 
          });
          
          // Update sinceId for next poll
          if (mentions.data.meta?.newest_id) {
            sinceId = mentions.data.meta.newest_id;
          }
          
          // Process each mention with delay to avoid rate limits
          for (const tweet of mentions.data.data) {
            // Skip own tweets
            if (tweet.author_id === this.botUserId) {
              logger.bot('twitter', 'Skipping own tweet', { tweetId: tweet.id });
              continue;
            }

            logger.bot('twitter', 'Processing mention', { 
              tweetId: tweet.id,
              authorId: tweet.author_id,
              textPreview: tweet.text?.substring(0, 50)
            });
            
            await handlers.handleMention(this, tweet);
            
            // Add delay between processing mentions to avoid rate limits
            await sleep(2000);
          }
          
          consecutiveErrors = 0; // Reset error counter on success
        } else {
          logger.bot('twitter', 'No new mentions');
        }
      } catch (error) {
        consecutiveErrors++;
        const isRateLimit = error.code === 429 || error.rateLimit;
        
        logger.error('Twitter polling error', { 
          error: error.message,
          code: error.code,
          consecutiveErrors,
          isRateLimit,
          rateLimitReset: error.rateLimit?.reset ? 
            new Date(error.rateLimit.reset * 1000).toISOString() : null
        });
        
        // If rate limited, extend the polling interval
        if (isRateLimit) {
          const resetTime = error.rateLimit?.reset 
            ? error.rateLimit.reset * 1000 - Date.now() 
            : 300000; // 5 minutes default
          
          logger.warn(`Rate limited. Next poll in ${Math.round(resetTime / 1000)}s`);
          // Don't poll again until rate limit resets
        }
        
        // If too many consecutive errors, log a warning
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          logger.error('Twitter polling has failed multiple times consecutively', {
            consecutiveErrors,
            botUserId: this.botUserId,
            hasClient: !!this.streamClient,
            authMethod: this.authMethod
          });
        }
      }
    };

    // Poll every 60 seconds (respecting rate limits)
    // First poll happens after a delay
    setTimeout(() => {
      pollMentions();
    }, 5000);
    
    // Then poll every 60 seconds
    setInterval(pollMentions, 60000);
    
    logger.info('Twitter mention polling started', {
      interval: '60 seconds',
      botUserId: this.botUserId,
      authMethod: this.authMethod
    });
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
          
          // Delay between processing webhook events
          await sleep(1000);
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

      // Use retry logic for API calls
      const response = await retryWithBackoff(async () => {
        return await this.client.v2.tweet(truncatedText, {
          reply: {
            in_reply_to_tweet_id: tweetId
          }
        });
      }, 3, 2000);
      
      logger.bot('twitter', 'Reply sent', { 
        replyTo: tweetId, 
        tweetId: response.data.id,
        authMethod: this.authMethod
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send Twitter reply', { 
        tweetId, 
        error: error.message,
        code: error.code,
        authMethod: this.authMethod,
        rateLimit: error.rateLimit
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
      const response = await retryWithBackoff(async () => {
        return await this.client.v2.sendDmToParticipant(userId, {
          text
        });
      }, 3, 2000);
      
      logger.bot('twitter', 'DM sent', { userId, authMethod: this.authMethod });
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
