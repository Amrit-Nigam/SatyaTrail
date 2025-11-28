/**
 * Twitter Bot Handlers
 * 
 * Handlers for Twitter mentions and DMs.
 */

const logger = require('../utils/logger');
const orchestrator = require('../routes/agents/orchestrator');

// Rate limiting map
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 60000; // 1 minute between requests per user

/**
 * Check rate limit for user
 */
const checkRateLimit = (userId) => {
  const lastRequest = rateLimitMap.get(userId);
  const now = Date.now();
  
  if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
    return { limited: true };
  }
  
  rateLimitMap.set(userId, now);
  return { limited: false };
};

/**
 * Extract URLs from tweet
 */
const extractUrls = (tweet) => {
  const urls = [];
  
  // Check entities for URLs
  if (tweet.entities?.urls) {
    for (const urlEntity of tweet.entities.urls) {
      if (urlEntity.expanded_url) {
        urls.push(urlEntity.expanded_url);
      }
    }
  }
  
  // Fallback to regex
  if (urls.length === 0) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = tweet.text?.match(urlRegex) || [];
    urls.push(...matches);
  }
  
  return urls;
};

/**
 * Extract claim text from tweet (remove mentions and URLs)
 */
const extractClaim = (text) => {
  return text
    .replace(/@\w+/g, '') // Remove mentions
    .replace(/(https?:\/\/[^\s]+)/g, '') // Remove URLs
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Handle mention tweet
 * @param {Object} bot - Twitter bot instance
 * @param {Object} tweet - Tweet object
 */
const handleMention = async (bot, tweet) => {
  const userId = tweet.author_id;
  const tweetId = tweet.id;
  
  logger.bot('twitter', 'Processing mention', { 
    tweetId, 
    userId,
    textPreview: tweet.text?.substring(0, 50)
  });
  
  // Check rate limit
  if (checkRateLimit(userId).limited) {
    logger.bot('twitter', 'Rate limited', { userId });
    return;
  }
  
  try {
    // Extract URL or claim
    const urls = extractUrls(tweet);
    const claim = extractClaim(tweet.text);
    
    if (urls.length === 0 && claim.length < 10) {
      // Not enough content to verify
      await bot.reply(tweetId, 
        '🔍 Send me a news URL or claim to verify!\n\nExample: @SatyaTrailBot verify https://example.com/article'
      );
      return;
    }
    
    // Run verification
    const result = await orchestrator.verifyQuick({
      url: urls[0],
      text: urls.length === 0 ? claim : undefined,
      source: 'twitter'
    });
    
    // Format response (must fit in 280 chars)
    const verdictEmoji = {
      true: '✅',
      false: '❌',
      mixed: '⚠️',
      unknown: '❓'
    };
    
    const verdict = result.verdict;
    const accuracy = result.accuracy_score;
    const summary = result.summary?.substring(0, 100) || '';
    
    const response = `${verdictEmoji[verdict]} Verdict: ${verdict.toUpperCase()}\n📊 Accuracy: ${accuracy}/100\n\n${summary}${summary.length >= 100 ? '...' : ''}\n\n🔗 Full report: ${result.detail_url || 'satyatrail.com'}`;
    
    await bot.reply(tweetId, response);
    
    logger.bot('twitter', 'Verification reply sent', {
      tweetId,
      verdict,
      accuracy
    });
  } catch (error) {
    logger.error('Twitter mention handling failed', {
      tweetId,
      error: error.message
    });
    
    // Send error reply
    try {
      await bot.reply(tweetId, 
        '❌ Sorry, verification failed. Please try again later or visit satyatrail.com'
      );
    } catch {}
  }
};

/**
 * Handle direct message
 * @param {Object} bot - Twitter bot instance
 * @param {Object} dm - DM object
 */
const handleDirectMessage = async (bot, dm) => {
  const senderId = dm.sender_id;
  const text = dm.message_data?.text;
  
  logger.bot('twitter', 'Processing DM', { 
    senderId,
    textPreview: text?.substring(0, 50)
  });
  
  // Don't respond to own messages
  if (senderId === bot.botUserId) return;
  
  // Check rate limit
  if (checkRateLimit(senderId).limited) {
    await bot.sendDM(senderId, 
      '⏳ Please wait a moment before your next verification request.'
    );
    return;
  }
  
  try {
    // Check for help/start commands
    const lowerText = text?.toLowerCase() || '';
    
    if (lowerText === 'help' || lowerText === 'start' || lowerText === '/start') {
      await bot.sendDM(senderId, 
        '🔍 Welcome to SatyaTrail!\n\n' +
        'Send me:\n' +
        '• A news article URL\n' +
        '• A claim to verify\n\n' +
        'I\'ll analyze it and give you a verdict with my confidence score.\n\n' +
        'Visit satyatrail.com for more info!'
      );
      return;
    }
    
    // Extract URL or use text as claim
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text?.match(urlRegex) || [];
    const claim = text?.replace(urlRegex, '').trim();
    
    if (urls.length === 0 && (!claim || claim.length < 10)) {
      await bot.sendDM(senderId,
        'Please send me a news URL or a claim to verify.\n\n' +
        'Example: https://example.com/news-article\n' +
        'Or: "The government announced new policy X"'
      );
      return;
    }
    
    // Send processing message
    await bot.sendDM(senderId, '🔄 Verifying... This may take a moment.');
    
    // Run verification
    const result = await orchestrator.verify({
      url: urls[0],
      text: urls.length === 0 ? claim : undefined,
      source: 'twitter'
    });
    
    // Format response
    const verdictEmoji = {
      true: '✅',
      false: '❌',
      mixed: '⚠️',
      unknown: '❓'
    };
    
    const response = 
      `${verdictEmoji[result.verdict]} Verification Complete\n\n` +
      `Verdict: ${result.verdict.toUpperCase()}\n` +
      `Accuracy: ${result.accuracy_score}/100\n\n` +
      `Summary: ${result.agent_reports?.[0]?.summary?.substring(0, 300) || 'Analysis complete.'}\n\n` +
      `🔗 Blockchain proof: ${result.blockchain_hash?.substring(0, 20)}...`;
    
    await bot.sendDM(senderId, response);
    
    logger.bot('twitter', 'DM verification sent', {
      senderId,
      verdict: result.verdict
    });
  } catch (error) {
    logger.error('Twitter DM handling failed', {
      senderId,
      error: error.message
    });
    
    await bot.sendDM(senderId,
      '❌ Sorry, verification failed. Please try again later.'
    );
  }
};

module.exports = {
  handleMention,
  handleDirectMessage
};

