/**
 * WhatsApp Handlers (Twilio)
 *
 * Mirrors Telegram verification workflow using the same orchestrator.
 */

const logger = require('../utils/logger');
const orchestrator = require('../routes/agents/orchestrator');

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

  console.log('[WhatsApp Handler] Processing incoming message:', {
    from,
    to,
    bodyLength: body.length,
    bodyPreview: body.substring(0, 80),
  });

  logger.bot('whatsapp', 'Incoming message', {
    from,
    to,
    bodyPreview: body.substring(0, 100),
  });

  if (!body) {
    console.log('[WhatsApp Handler] Empty message body, returning prompt');
    return 'Please send a news URL or a claim to verify.';
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

module.exports = {
  handleIncomingMessage,
};


