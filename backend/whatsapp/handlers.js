/**
 * WhatsApp Handlers (Twilio)
 *
 * Mirrors Telegram verification workflow using the same orchestrator.
 * Supports text messages and image analysis.
 */

const logger = require('../utils/logger');
const orchestrator = require('../routes/agents/orchestrator');
const { analyzeImageWithVision } = require('../services/imageAnalysisService');

console.log('[WhatsApp] Handlers module loaded');

// Simple rate limiting per WhatsApp sender (From number)
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 30000; // 30 seconds between requests

const checkRateLimit = (senderId) => {
  const lastRequest = rateLimitMap.get(senderId);
  const now = Date.now();

  if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
    const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastRequest)) / 1000);
    return { limited: true, waitTime };
  }

  rateLimitMap.set(senderId, now);
  return { limited: false };
};

/**
 * Process an incoming WhatsApp message via Twilio.
 * @param {Object} params - Incoming message parameters (Twilio webhook body)
 * @returns {Promise<string>} - Reply text to send back to the user
 */
const handleIncomingMessage = async (params) => {
  const from = params.From || '';
  const to = params.To || '';
  const body = (params.Body || '').trim();
  const numMedia = parseInt(params.NumMedia || '0', 10);
  const mediaUrl = params.MediaUrl0 || null;
  const mediaContentType = params.MediaContentType0 || null;

  console.log('[WhatsApp Handler] Processing incoming message:', {
    from,
    to,
    bodyLength: body.length,
    bodyPreview: body.substring(0, 80),
    numMedia,
    hasMediaUrl: !!mediaUrl,
    mediaContentType,
  });

  logger.bot('whatsapp', 'Incoming message', {
    from,
    to,
    bodyPreview: body.substring(0, 100),
    numMedia,
    hasMedia: !!mediaUrl,
  });

  // Check if this is a media message (image)
  if (numMedia > 0 && mediaUrl && mediaContentType?.startsWith('image/')) {
    console.log('[WhatsApp Handler] 📸 Image detected, processing image analysis');
    return handleImageMessage(params);
  }

  if (!body) {
    console.log('[WhatsApp Handler] Empty message body, returning prompt');
    return 'Please send a news URL, a claim to verify, or an image to analyze for authenticity.';
  }

  // Rate limit per sender
  const rateLimit = checkRateLimit(from);
  if (rateLimit.limited) {
    console.log('[WhatsApp Handler] Rate limited:', { from, waitTime: rateLimit.waitTime });
    return `⏳ Please wait ${rateLimit.waitTime} seconds before your next verification.`;
  }

  // Determine if input is URL or text
  const isUrl = /^https?:\/\//i.test(body);
  console.log('[WhatsApp Handler] Input type:', { isUrl, inputPreview: body.substring(0, 50) });

  try {
    const start = Date.now();
    console.log('[WhatsApp Handler] Starting verification...');

    const result = await orchestrator.verify({
      url: isUrl ? body : undefined,
      text: isUrl ? undefined : body,
      source: 'whatsapp',
    });

    console.log('[WhatsApp Handler] Verification complete:', {
      verdict: result.verdict,
      accuracy: result.accuracy_score,
      hasClaims: !!(result.claim_verdicts?.length),
      hasBlockchainHash: !!result.blockchain_hash,
    });

    const duration = Date.now() - start;

    const verdictEmoji = {
      true: '✅',
      false: '❌',
      mixed: '⚠️',
      unknown: '❓',
    };

    const emoji = verdictEmoji[result.verdict] || '❓';

    let reply = `${emoji} Verification Result\n\n`;
    reply += `Verdict: ${result.verdict.toUpperCase()}\n`;
    reply += `Accuracy: ${result.accuracy_score}/100\n\n`;

    if (result.agent_reports?.[0]?.summary || result.summary) {
      reply += `Summary:\n${
        result.agent_reports?.[0]?.summary ||
        result.summary
      }\n\n`;
    }

    if (result.claim_verdicts && result.claim_verdicts.length > 0) {
      reply += `Claims Analyzed: ${result.claim_verdicts.length}\n`;
      result.claim_verdicts.slice(0, 2).forEach((claim) => {
        reply += `• ${claim.verdict}: ${claim.claim.substring(0, 80)}...\n`;
      });
      reply += '\n';
    }

    if (result.blockchain_hash) {
      const txUrl = `https://sepolia.etherscan.io/tx/${result.blockchain_hash}`;
      reply += `Blockchain Proof:\n${txUrl}\n\n`;
    }

    reply += `Processed in ${duration}ms.`;

    logger.bot('whatsapp', 'Verification sent', {
      from,
      verdict: result.verdict,
      accuracy: result.accuracy_score,
      duration,
    });

    return reply;
  } catch (error) {
    console.error('[WhatsApp Handler] Verification error:', {
      from,
      error: error.message,
      stack: error.stack?.substring(0, 300),
    });
    
    logger.error('WhatsApp verification failed', {
      from,
      error: error.message,
    });

    return '❌ Sorry, verification failed. Please try again later.';
  }
};

/**
 * Handle image messages for authenticity analysis
 * @param {Object} params - Twilio webhook params containing media info
 * @returns {Promise<string>} - Reply text with analysis result
 */
const handleImageMessage = async (params) => {
  const from = params.From || '';
  const mediaUrl = params.MediaUrl0;
  const caption = params.Body || '';

  console.log('[WhatsApp Handler] 📸 Analyzing image:', {
    from,
    mediaUrl: mediaUrl?.substring(0, 80) + '...',
    hasCaption: !!caption,
  });

  logger.bot('whatsapp', 'Image message received', {
    from,
    hasCaption: !!caption,
  });

  // Rate limit check
  const rateLimit = checkRateLimit(from);
  if (rateLimit.limited) {
    console.log('[WhatsApp Handler] Rate limited for image:', { from, waitTime: rateLimit.waitTime });
    return `⏳ Please wait ${rateLimit.waitTime} seconds before your next analysis.`;
  }

  try {
    const start = Date.now();
    console.log('[WhatsApp Handler] 📸 Starting image analysis with GPT-4o Vision...');

    // Analyze the image using GPT-4o Vision
    const analysisResult = await analyzeImageWithVision(mediaUrl, null, {
      caption,
      source: 'whatsapp',
    });

    const duration = Date.now() - start;

    console.log('[WhatsApp Handler] 📸 Image analysis complete:', {
      verdict: analysisResult.verdict,
      confidence: analysisResult.confidence,
      aiGenerated: analysisResult.aiGenerated,
      duration,
    });

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

    let reply = `${emoji} *Image Authenticity Analysis*\n\n`;
    reply += `*Verdict:* ${analysisResult.verdict}\n`;
    reply += `*Confidence:* ${analysisResult.confidence}%\n\n`;
    reply += `${aiEmoji} *AI Generated:* ${analysisResult.aiGenerated}\n\n`;
    reply += `📝 *Analysis:*\n${analysisResult.reasoning}\n`;

    // Add manipulation signs if any
    if (analysisResult.manipulationSigns && analysisResult.manipulationSigns.length > 0) {
      reply += `\n⚠️ *Manipulation Indicators:*\n`;
      analysisResult.manipulationSigns.forEach(sign => {
        reply += `• ${sign}\n`;
      });
    }

    reply += `\n_Analyzed in ${duration}ms_`;
    reply += `\n\n_Note: This analysis is AI-assisted and may not be 100% accurate._`;

    logger.bot('whatsapp', 'Image analysis sent', {
      from,
      verdict: analysisResult.verdict,
      confidence: analysisResult.confidence,
      aiGenerated: analysisResult.aiGenerated,
      duration,
    });

    return reply;
  } catch (error) {
    console.error('[WhatsApp Handler] 📸 Image analysis error:', {
      from,
      error: error.message,
      stack: error.stack?.substring(0, 300),
    });

    logger.error('WhatsApp image analysis failed', {
      from,
      error: error.message,
    });

    return '❌ Sorry, image analysis failed. Please try again later.';
  }
};

module.exports = {
  handleIncomingMessage,
  handleImageMessage,
};


