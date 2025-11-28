/**
 * Telegram Bot Handlers
 * 
 * Message and command handlers for the Telegram bot.
 */

const logger = require('../utils/logger');
const orchestrator = require('../routes/agents/orchestrator');

// Rate limiting map (userId -> last request timestamp)
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 30000; // 30 seconds between requests

/**
 * Check rate limit for user
 */
const checkRateLimit = (userId) => {
  const lastRequest = rateLimitMap.get(userId);
  const now = Date.now();
  
  if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
    const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastRequest)) / 1000);
    return { limited: true, waitTime };
  }
  
  rateLimitMap.set(userId, now);
  return { limited: false };
};

/**
 * Extract URLs from text
 */
const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

/**
 * Handle /start command
 */
const handleStart = async (ctx) => {
  logger.bot('telegram', 'Start command', { userId: ctx.from?.id });
  
  await ctx.reply(`
🔍 *Welcome to SatyaTrail Bot!*

I help you verify news articles and claims using AI-powered fact-checking.

*How to use:*
• Send me a URL to any news article
• Or send me a claim/text to verify
• Use /verify followed by a URL or text

*Commands:*
/verify <url or text> - Verify content
/status - Check bot status
/help - Show this help message

Let's fight misinformation together! 💪
  `, { parse_mode: 'Markdown' });
};

/**
 * Handle /help command
 */
const handleHelp = async (ctx) => {
  logger.bot('telegram', 'Help command', { userId: ctx.from?.id });
  
  await ctx.reply(`
📚 *SatyaTrail Help*

*Verification:*
Simply send me:
• A news article URL
• A claim or text to verify
• Use /verify <url or text>

*What I check:*
• Multiple news sources
• Fact-checking databases
• Source credibility
• Information trail

*Results include:*
✅ Verdict (True/False/Mixed/Unknown)
📊 Accuracy score
📝 Detailed analysis
🔗 Blockchain proof

*Rate Limit:*
One verification every 30 seconds.

*Support:*
Visit satyatrail.com for more info.
  `, { parse_mode: 'Markdown' });
};

/**
 * Handle /verify command
 */
const handleVerify = async (ctx) => {
  const userId = ctx.from?.id;
  const text = ctx.message?.text?.replace('/verify', '').trim();
  
  logger.bot('telegram', 'Verify command', { userId, hasText: !!text });
  
  if (!text) {
    return ctx.reply('Please provide a URL or text to verify.\n\nExample: /verify https://example.com/news-article');
  }
  
  // Check rate limit
  const rateLimit = checkRateLimit(userId);
  if (rateLimit.limited) {
    return ctx.reply(`⏳ Please wait ${rateLimit.waitTime} seconds before your next verification.`);
  }
  
  await processVerification(ctx, text);
};

/**
 * Handle /status command
 */
const handleStatus = async (ctx) => {
  logger.bot('telegram', 'Status command', { userId: ctx.from?.id });
  
  const orchestratorStatus = orchestrator.getStatus();
  
  await ctx.reply(`
🤖 *Bot Status*

*Status:* ✅ Operational
*Agents:* ${orchestratorStatus.availableAgents.join(', ')}
*Mode:* ${process.env.TELEGRAM_MODE || 'polling'}

_Last checked: ${new Date().toISOString()}_
  `, { parse_mode: 'Markdown' });
};

/**
 * Handle regular text messages
 */
const handleText = async (ctx) => {
  const text = ctx.message?.text;
  const userId = ctx.from?.id;
  
  // Ignore commands
  if (text?.startsWith('/')) return;
  
  logger.bot('telegram', 'Text message', { userId, hasUrl: text?.includes('http') });
  
  // Check rate limit
  const rateLimit = checkRateLimit(userId);
  if (rateLimit.limited) {
    return ctx.reply(`⏳ Please wait ${rateLimit.waitTime} seconds before your next verification.`);
  }
  
  // Check if it contains a URL or is a verification request
  const urls = extractUrls(text);
  
  if (urls.length > 0 || text.length > 20) {
    await processVerification(ctx, urls[0] || text);
  } else {
    await ctx.reply('Send me a news URL or a claim to verify. Use /help for more info.');
  }
};

/**
 * Handle inline queries
 */
const handleInlineQuery = async (ctx) => {
  const query = ctx.inlineQuery?.query;
  
  if (!query || query.length < 10) {
    return ctx.answerInlineQuery([]);
  }
  
  logger.bot('telegram', 'Inline query', { queryLength: query.length });
  
  // Return a result that prompts full verification
  await ctx.answerInlineQuery([
    {
      type: 'article',
      id: '1',
      title: 'Verify this content',
      description: query.substring(0, 100),
      input_message_content: {
        message_text: `🔍 Verifying: ${query.substring(0, 100)}...\n\nOpen @SatyaTrailBot to see the full verification.`
      }
    }
  ]);
};

/**
 * Process verification request
 */
const processVerification = async (ctx, input) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  
  // Send processing message
  const processingMsg = await ctx.reply('🔄 Verifying... This may take a moment.');
  
  try {
    // Determine if input is URL or text
    const isUrl = input.startsWith('http');
    
    // Run verification
    const result = await orchestrator.verify({
      url: isUrl ? input : undefined,
      text: isUrl ? undefined : input,
      source: 'telegram'
    });
    
    // Delete processing message
    await ctx.telegram.deleteMessage(chatId, processingMsg.message_id);
    
    // Send result
    const verdictEmoji = {
      true: '✅',
      false: '❌',
      mixed: '⚠️',
      unknown: '❓'
    };
    
    const resultMessage = `
${verdictEmoji[result.verdict]} *Verification Complete*

*Verdict:* ${result.verdict.toUpperCase()}
*Accuracy:* ${result.accuracy_score}/100

📝 *Summary:*
${result.agent_reports?.[0]?.summary?.substring(0, 500) || 'Analysis complete.'}

🔗 *Blockchain Proof:*
\`${result.blockchain_hash?.substring(0, 30)}...\`

${result.metadata?.remaining_uncertainties?.length > 0 ? `\n⚠️ *Note:* ${result.metadata.remaining_uncertainties[0]}` : ''}
    `.trim();
    
    await ctx.reply(resultMessage, { 
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message?.message_id
    });
    
    logger.bot('telegram', 'Verification sent', {
      userId,
      verdict: result.verdict,
      accuracy: result.accuracy_score
    });
  } catch (error) {
    logger.error('Telegram verification failed', { userId, error: error.message });
    
    // Delete processing message
    try {
      await ctx.telegram.deleteMessage(chatId, processingMsg.message_id);
    } catch {}
    
    await ctx.reply('❌ Sorry, verification failed. Please try again later.');
  }
};

module.exports = {
  handleStart,
  handleHelp,
  handleVerify,
  handleStatus,
  handleText,
  handleInlineQuery
};

