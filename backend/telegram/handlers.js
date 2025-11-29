/**
 * Telegram Bot Handlers
 * 
 * Message and command handlers for the Telegram bot.
 */

const logger = require('../utils/logger');
const orchestrator = require('../routes/agents/orchestrator');
const { analyzeImageWithVision } = require('../services/imageAnalysisService');

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
  const chatType = ctx.chat?.type;
  const isGroup = chatType === 'group' || chatType === 'supergroup';
  
  logger.bot('telegram', 'Start command', { 
    userId: ctx.from?.id,
    chatType 
  });
  
  if (isGroup) {
    await ctx.reply(`
🔍 *SatyaTrail Bot Added!*

I help verify news and claims in group chats.

*How to use in groups:*
1️⃣ Reply to a message with a claim
2️⃣ Mention me: @veritttyBot is this true?

*Example:*
User: "Elon Musk sold all his shares"
You: Reply → "@veritttyBot is this true?"

*Commands:*
/verify <url or text> - Verify directly
/help - Show help

Let's fight misinformation together! 💪
    `, { parse_mode: 'Markdown' });
  } else {
    await ctx.reply(`
🔍 *Welcome to SatyaTrail Bot!*

I help you verify news articles and claims using AI-powered fact-checking.

*How to use:*
• Send me a URL to any news article
• Or send me a claim/text to verify
• Use /verify followed by a URL or text

*In Groups:*
Reply to a message and mention me with "is this true?"

*Commands:*
/verify <url or text> - Verify content
/status - Check bot status
/help - Show this help message

Let's fight misinformation together! 💪
    `, { parse_mode: 'Markdown' });
  }
};

/**
 * Handle /help command
 */
const handleHelp = async (ctx) => {
  const chatType = ctx.chat?.type;
  const isGroup = chatType === 'group' || chatType === 'supergroup';
  
  logger.bot('telegram', 'Help command', { 
    userId: ctx.from?.id,
    chatType 
  });
  
  if (isGroup) {
    await ctx.reply(`
📚 *SatyaTrail Help - Group Chat*

*How to verify in groups:*
1️⃣ Reply to a message containing a claim
2️⃣ Type: @veritttyBot is this true?
   Or: @veritttyBot verify this

*Example:*
User A: "Breaking: Company X announced..."
User B: [Reply] "@veritttyBot is this true?"

*Direct verification:*
/verify <url or text> - Verify directly

*What I check:*
✅ Multiple news sources
✅ Fact-checking databases  
✅ Source credibility
✅ Information trail

*Results:*
✅ Verdict (True/False/Misleading)
📊 Confidence score
📝 Detailed analysis

*Rate Limit:* One verification every 30 seconds
    `, { parse_mode: 'Markdown' });
  } else {
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
  }
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
 * Check if bot is mentioned in message
 */
const isBotMentioned = (ctx) => {
  const text = ctx.message?.text || ctx.message?.caption || '';
  const entities = ctx.message?.entities || ctx.message?.caption_entities || [];
  const botUsername = ctx.botInfo?.username?.toLowerCase();
  const botId = ctx.botInfo?.id;
  
  if (!botUsername && !botId) {
    logger.warn('Bot info not available for mention detection', {
      hasBotInfo: !!ctx.botInfo,
      botInfo: ctx.botInfo
    });
    // Fallback: check for common bot username patterns
    const commonPatterns = ['veritttybot', 'verittty', 'satyatrail'];
    return commonPatterns.some(pattern => text.toLowerCase().includes(`@${pattern}`));
  }
  
  // Check for @mentions in entities
  for (const entity of entities) {
    if (entity.type === 'mention') {
      const mention = text.substring(entity.offset, entity.offset + entity.length).toLowerCase().trim();
      const expectedMention = `@${botUsername}`.toLowerCase();
      
      logger.bot('telegram', 'Checking mention entity', {
        mention,
        expectedMention,
        matches: mention === expectedMention
      });
      
      if (mention === expectedMention) {
        return true;
      }
    }
    
    // Also check for text_mention (when bot is mentioned by ID)
    if (entity.type === 'text_mention' && entity.user?.id === botId) {
      return true;
    }
  }
  
  // Fallback: Check if message contains bot username (case-insensitive)
  if (botUsername) {
    const lowerText = text.toLowerCase();
    const mentionPattern = `@${botUsername}`.toLowerCase();
    
    if (lowerText.includes(mentionPattern)) {
      logger.bot('telegram', 'Bot mentioned via text match', {
        text: lowerText,
        pattern: mentionPattern
      });
      return true;
    }
  }
  
  return false;
};

/**
 * Extract claim from replied-to message
 */
const extractClaimFromReply = async (ctx) => {
  const replyToMessage = ctx.message?.reply_to_message;
  
  if (!replyToMessage) {
    return null;
  }
  
  // Get text from replied message
  let claimText = replyToMessage.text || replyToMessage.caption || '';
  
  // If replied message has entities (like URLs), extract them
  if (replyToMessage.entities) {
    const urls = extractUrls(claimText);
    if (urls.length > 0) {
      return urls[0]; // Return URL if found
    }
  }
  
  return claimText || null;
};

/**
 * Handle regular text messages
 */
const handleText = async (ctx) => {
  const text = ctx.message?.text || ctx.message?.caption;
  const userId = ctx.from?.id;
  const chatType = ctx.chat?.type; // 'private', 'group', 'supergroup', 'channel'
  const isGroup = chatType === 'group' || chatType === 'supergroup';
  
  // Ignore commands
  if (text?.startsWith('/')) return;
  
  // Check if bot is mentioned
  const mentioned = isBotMentioned(ctx);
  
  logger.bot('telegram', 'Text message', { 
    userId, 
    chatType,
    isGroup,
    hasUrl: text?.includes('http'),
    isBotMentioned: mentioned,
    hasReply: !!ctx.message?.reply_to_message,
    text: text?.substring(0, 100),
    botUsername: ctx.botInfo?.username,
    botId: ctx.botInfo?.id
  });
  
  // Check if bot is mentioned in group chat
  if (isGroup && mentioned) {
    // Check if this is a verification request (contains "is this true", "verify", etc.)
    const verificationKeywords = ['is this true', 'is this false', 'verify', 'check', 'fact check', 'true?', 'false?'];
    const lowerText = text.toLowerCase();
    const isVerificationRequest = verificationKeywords.some(keyword => lowerText.includes(keyword));
    
    if (isVerificationRequest) {
      // Check rate limit
      const rateLimit = checkRateLimit(userId);
      if (rateLimit.limited) {
        return ctx.reply(`⏳ Please wait ${rateLimit.waitTime} seconds before your next verification.`, {
          reply_to_message_id: ctx.message.message_id
        });
      }
      
      // Try to get claim from replied message
      const claim = await extractClaimFromReply(ctx);
      
      logger.bot('telegram', 'Processing verification request', {
        userId,
        hasClaim: !!claim,
        claimLength: claim?.length,
        hasReply: !!ctx.message.reply_to_message
      });
      
      if (claim && claim.trim().length > 10) {
        // Verify the claim from the replied message
        const processingMsg = await ctx.reply('🔄 Verifying the claim from the previous message...', {
          reply_to_message_id: ctx.message.message_id
        });
        await processVerification(ctx, claim.trim(), ctx.message.reply_to_message.message_id);
        // Delete processing message will be handled in processVerification
        return;
      } else {
        // No reply found or claim too short, try to extract from current message
        // Remove the mention and verification keywords to get the actual claim
        let extractedClaim = text;
        if (extractedClaim) {
          // Remove bot mention
          extractedClaim = extractedClaim.replace(new RegExp(`@${ctx.botInfo?.username || 'veritttyBot'}`, 'gi'), '');
          // Remove verification keywords
          extractedClaim = extractedClaim.replace(/is this true\??/gi, '');
          extractedClaim = extractedClaim.replace(/is this false\??/gi, '');
          extractedClaim = extractedClaim.replace(/verify/gi, '');
          extractedClaim = extractedClaim.replace(/check/gi, '');
          extractedClaim = extractedClaim.trim();
          
          if (extractedClaim.length > 10) {
            logger.bot('telegram', 'Extracted claim from message text', {
              extractedClaim: extractedClaim.substring(0, 100)
            });
            const processingMsg = await ctx.reply('🔄 Verifying...', {
              reply_to_message_id: ctx.message.message_id
            });
            await processVerification(ctx, extractedClaim, ctx.message.message_id);
            return;
          }
        }
        
        // No claim found, ask user to reply to a message
        return ctx.reply('📝 Please reply to a message containing the claim you want to verify, then mention me with "is this true?"\n\nOr include the claim in your message after mentioning me.', {
          reply_to_message_id: ctx.message.message_id
        });
      }
    }
    
    // Bot mentioned but not a verification request - show help
    return ctx.reply('👋 Hi! To verify a claim:\n\n1️⃣ Reply to a message with the claim\n2️⃣ Mention me with "is this true?" or "verify this"\n\nExample: Reply to a message and type "@veritttyBot is this true?"', {
      reply_to_message_id: ctx.message.message_id
    });
  }
  
  // Private chat or no mention - handle normally
  if (!isGroup) {
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
  }
  // In groups, only respond when mentioned
};

/**
 * Handle bot mentions (dedicated handler)
 */
const handleMention = async (ctx) => {
  const text = ctx.message?.text || ctx.message?.caption || '';
  const userId = ctx.from?.id;
  const chatType = ctx.chat?.type;
  const isGroup = chatType === 'group' || chatType === 'supergroup';
  
  logger.bot('telegram', 'Bot mentioned', {
    userId,
    chatType,
    isGroup,
    text: text.substring(0, 100),
    hasReply: !!ctx.message?.reply_to_message
  });
  
  // In groups, process as verification request
  if (isGroup) {
    // Check if this is a verification request
    const verificationKeywords = ['is this true', 'is this false', 'verify', 'check', 'fact check', 'true?', 'false?', 'true ?', 'false ?'];
    const lowerText = text.toLowerCase();
    const isVerificationRequest = verificationKeywords.some(keyword => lowerText.includes(keyword));
    
    if (isVerificationRequest) {
      // Check rate limit
      const rateLimit = checkRateLimit(userId);
      if (rateLimit.limited) {
        return ctx.reply(`⏳ Please wait ${rateLimit.waitTime} seconds before your next verification.`, {
          reply_to_message_id: ctx.message.message_id
        });
      }
      
      // Try to get claim from replied message
      const claim = await extractClaimFromReply(ctx);
      
      logger.bot('telegram', 'Processing mention verification', {
        userId,
        hasClaim: !!claim,
        claimLength: claim?.length
      });
      
      if (claim && claim.trim().length > 10) {
        const processingMsg = await ctx.reply('🔄 Verifying the claim from the previous message...', {
          reply_to_message_id: ctx.message.message_id
        });
        await processVerification(ctx, claim.trim(), ctx.message.reply_to_message.message_id);
        return;
      } else {
        // Try to extract claim from current message
        let extractedClaim = text;
        if (extractedClaim) {
          extractedClaim = extractedClaim.replace(new RegExp(`@${ctx.botInfo?.username || 'veritttyBot'}`, 'gi'), '');
          extractedClaim = extractedClaim.replace(/is this true\??/gi, '');
          extractedClaim = extractedClaim.replace(/is this false\??/gi, '');
          extractedClaim = extractedClaim.replace(/verify/gi, '');
          extractedClaim = extractedClaim.replace(/check/gi, '');
          extractedClaim = extractedClaim.trim();
          
          if (extractedClaim.length > 10) {
            const processingMsg = await ctx.reply('🔄 Verifying...', {
              reply_to_message_id: ctx.message.message_id
            });
            await processVerification(ctx, extractedClaim, ctx.message.message_id);
            return;
          }
        }
        
        return ctx.reply('📝 Please reply to a message containing the claim you want to verify, then mention me with "is this true?"', {
          reply_to_message_id: ctx.message.message_id
        });
      }
    } else {
      // Mentioned but not a verification request
      return ctx.reply('👋 Hi! To verify a claim:\n\n1️⃣ Reply to a message with the claim\n2️⃣ Mention me with "is this true?" or "verify this"\n\nExample: Reply to a message and type "@veritttyBot is this true?"', {
        reply_to_message_id: ctx.message.message_id
      });
    }
  }
  
  // In private chat, just process normally
  return handleText(ctx);
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
const processVerification = async (ctx, input, originalMessageId = null) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
  
  // Send processing message
  const processingMsg = await ctx.reply('🔄 Verifying... This may take a moment.', {
    reply_to_message_id: originalMessageId || ctx.message?.message_id
  });
  
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
    try {
      await ctx.telegram.deleteMessage(chatId, processingMsg.message_id);
    } catch (e) {
      logger.warn('Could not delete processing message', { error: e.message });
    }
    
    // Send result
    const verdictEmoji = {
      true: '✅',
      false: '❌',
      mixed: '⚠️',
      unknown: '❓'
    };
    
    const emoji = verdictEmoji[result.verdict] || '❓';
    const accuracyBar = createProgressBar(result.accuracy_score);
    
    // Build result message
    let resultMessage = `
${emoji} *Verification Result*

*Verdict:* ${result.verdict.toUpperCase()}
*Confidence:* ${accuracyBar} ${result.accuracy_score}%

📝 *Summary:*
${result.agent_reports?.[0]?.summary?.substring(0, 400) || result.summary?.substring(0, 400) || 'Analysis complete.'}
    `.trim();
    
    // Add claim details if available
    if (result.claim_verdicts && result.claim_verdicts.length > 0) {
      resultMessage += `\n\n*Claims Analyzed:* ${result.claim_verdicts.length}`;
      result.claim_verdicts.slice(0, 2).forEach((claim, idx) => {
        const claimEmoji = {
          True: '✅',
          False: '❌',
          Misleading: '⚠️',
          'Partially True': '⚠️',
          Unverifiable: '❓'
        };
        resultMessage += `\n${claimEmoji[claim.verdict] || '•'} ${claim.verdict}: ${claim.claim.substring(0, 60)}...`;
      });
    }
    
    // Add blockchain proof if available
    if (result.blockchain_hash) {
      const txUrl = `https://sepolia.etherscan.io/tx/${result.blockchain_hash}`;
      resultMessage += `\n\n🔗 *Blockchain Proof:*\n${txUrl}`;
    }
    
    // Reply options
    const replyOptions = {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };
    
    // In groups, reply to the original message that was verified
    if (isGroup && originalMessageId) {
      replyOptions.reply_to_message_id = originalMessageId;
    } else if (ctx.message?.message_id) {
      replyOptions.reply_to_message_id = ctx.message.message_id;
    }
    
    await ctx.reply(resultMessage, replyOptions);
    
    logger.bot('telegram', 'Verification sent', {
      userId,
      chatType: ctx.chat?.type,
      verdict: result.verdict,
      accuracy: result.accuracy_score
    });
  } catch (error) {
    logger.error('Telegram verification failed', { 
      userId, 
      error: error.message,
      stack: error.stack
    });
    
    // Delete processing message
    try {
      await ctx.telegram.deleteMessage(chatId, processingMsg.message_id);
    } catch (e) {}
    
    const errorReply = {
      reply_to_message_id: originalMessageId || ctx.message?.message_id
    };
    
    await ctx.reply('❌ Sorry, verification failed. Please try again later or check if the claim is clear enough.', errorReply);
  }
};

/**
 * Create a text-based progress bar
 */
const createProgressBar = (value) => {
  const filled = Math.round(value / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
};

/**
 * Handle photo messages
 */
const handlePhoto = async (ctx) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  const chatType = ctx.chat?.type;
  const isGroup = chatType === 'group' || chatType === 'supergroup';
  const caption = ctx.message?.caption || '';
  
  // In groups, only respond if mentioned
  if (isGroup) {
    const mentioned = isBotMentioned(ctx);
    if (!mentioned) {
      logger.bot('telegram', 'Photo in group but not mentioned, ignoring', { userId, chatId });
      return;
    }
  }
  
  console.log('[Telegram] 📸 Photo received:', {
    userId,
    chatType,
    hasCaption: !!caption,
    captionPreview: caption.substring(0, 50),
  });
  
  logger.bot('telegram', 'Photo message received', {
    userId,
    chatType,
    hasCaption: !!caption,
  });
  
  // Check rate limit
  const rateLimit = checkRateLimit(userId);
  if (rateLimit.limited) {
    return ctx.reply(`⏳ Please wait ${rateLimit.waitTime} seconds before your next verification.`, {
      reply_to_message_id: ctx.message.message_id
    });
  }
  
  // Get the largest photo (best quality)
  const photos = ctx.message.photo;
  if (!photos || photos.length === 0) {
    return ctx.reply('❌ Could not process the photo. Please try again.', {
      reply_to_message_id: ctx.message.message_id
    });
  }
  
  const largestPhoto = photos[photos.length - 1]; // Last one is largest
  
  // Send processing message
  const processingMsg = await ctx.reply('🔄 Analyzing image for authenticity... This may take a moment.', {
    reply_to_message_id: ctx.message.message_id
  });
  
  try {
    // Get file URL from Telegram
    const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);
    const imageUrl = fileLink.href;
    
    console.log('[Telegram] 📸 Got image URL:', imageUrl.substring(0, 80) + '...');
    
    // Analyze the image using GPT-4o Vision
    const analysisResult = await analyzeImageWithVision(imageUrl, null, {
      caption,
      source: 'telegram',
      chatType,
    });
    
    console.log('[Telegram] 📸 Analysis result:', analysisResult);
    
    // Delete processing message
    try {
      await ctx.telegram.deleteMessage(chatId, processingMsg.message_id);
    } catch (e) {
      logger.warn('Could not delete processing message', { error: e.message });
    }
    
    // Build result message
    const verdictEmoji = {
      AUTHENTIC: '✅',
      SUSPICIOUS: '⚠️',
      FAKE: '❌',
    };
    
    const aiGeneratedEmoji = {
      YES: '🤖',
      NO: '📷',
      UNCERTAIN: '❓',
    };
    
    const emoji = verdictEmoji[analysisResult.verdict] || '❓';
    const aiEmoji = aiGeneratedEmoji[analysisResult.aiGenerated] || '❓';
    const confidenceBar = createProgressBar(analysisResult.confidence);
    
    let resultMessage = `
${emoji} *Image Authenticity Analysis*

*Verdict:* ${analysisResult.verdict}
*Confidence:* ${confidenceBar} ${analysisResult.confidence}%

${aiEmoji} *AI Generated:* ${analysisResult.aiGenerated}

📝 *Analysis:*
${analysisResult.reasoning}
    `.trim();
    
    // Add manipulation signs if any
    if (analysisResult.manipulationSigns && analysisResult.manipulationSigns.length > 0) {
      resultMessage += `\n\n⚠️ *Manipulation Indicators:*`;
      analysisResult.manipulationSigns.forEach(sign => {
        resultMessage += `\n• ${sign}`;
      });
    }
    
    // Add disclaimer
    resultMessage += `\n\n_Note: This analysis is AI-assisted and may not be 100% accurate._`;
    
    await ctx.reply(resultMessage, {
      parse_mode: 'Markdown',
      reply_to_message_id: ctx.message.message_id
    });
    
    logger.bot('telegram', 'Image analysis sent', {
      userId,
      verdict: analysisResult.verdict,
      confidence: analysisResult.confidence,
      aiGenerated: analysisResult.aiGenerated,
    });
    
  } catch (error) {
    console.error('[Telegram] 📸 Image analysis error:', error.message);
    logger.error('Telegram image analysis failed', {
      userId,
      error: error.message,
      stack: error.stack
    });
    
    // Delete processing message
    try {
      await ctx.telegram.deleteMessage(chatId, processingMsg.message_id);
    } catch (e) {}
    
    await ctx.reply('❌ Sorry, image analysis failed. Please try again later.', {
      reply_to_message_id: ctx.message.message_id
    });
  }
};

module.exports = {
  handleStart,
  handleHelp,
  handleVerify,
  handleStatus,
  handleText,
  handleMention,
  handleInlineQuery,
  handlePhoto
};

