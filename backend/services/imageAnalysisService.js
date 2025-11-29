/**
 * Image Analysis Service
 * 
 * Analyzes image metadata and EXIF data to determine authenticity using GPT-4o.
 * Used by Telegram and WhatsApp bots for photo verification.
 */

const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes image metadata and EXIF data to determine authenticity
 * @param {Object} analysisData - Complete data for analysis
 * @returns {Promise<{verdict: string, confidence: number, reasoning: string}>}
 */
const analyzeImageAuthenticity = async (analysisData) => {
  try {
    console.log('[ImageAnalysis] 🤖 AI Analysis Request Data:');
    console.log('='.repeat(50));
    console.log('[ImageAnalysis] 📊 Raw Analysis Data:', JSON.stringify(analysisData, null, 2));
    console.log('='.repeat(50));

    const prompt = buildAnalysisPrompt(analysisData);

    console.log('[ImageAnalysis] 📝 GPT Prompt:');
    console.log('-'.repeat(30));
    console.log(prompt);
    console.log('-'.repeat(30));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert digital forensics analyst specializing in image authenticity verification. 
Your task is to analyze provided metadata and return a single-word verdict: AUTHENTIC, SUSPICIOUS, or FAKE.

Detailed Analysis Framework:
1. **Metadata Integrity**: Check for the presence of standard EXIF fields (Make, Model, DateTimeOriginal, ExposureTime, ISO). Missing critical fields suggests stripping/editing.
2. **Software Traces**: Scrutinize 'Software' tags. 'Adobe Photoshop', 'Lightroom', 'GIMP', or 'Canva' indicate manipulation. Original camera files usually show firmware versions (e.g., 'Ver.1.0').
3. **Device Consistency**: Verify if the ImageWidth/ImageHeight matches the known resolution of the Camera Make/Model.
4. **Temporal Consistency**: Check if DateTimeOriginal and DateTimeDigitized match. Significant discrepancies can indicate editing.
5. **GPS Logic**: If GPS is present, ensure it's not 0,0 or impossible coordinates.

Verdict Guidelines:
- **AUTHENTIC**: Consistent, complete EXIF data typical of original camera output. No editing software traces.
- **SUSPICIOUS**: Partial metadata, generic software tags, or minor inconsistencies.
- **FAKE**: Clear evidence of editing software, conflicting metadata, or impossible values.

Output Format:
Provide a single-word verdict, a confidence score (0-100), and a concise reasoning highlighting specific metadata findings.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_completion_tokens: 200,
    });

    const content = response.choices[0].message.content;

    console.log('[ImageAnalysis] 🤖 AI Response:');
    console.log('-'.repeat(30));
    console.log(content);
    console.log('-'.repeat(30));

    const parsedResult = parseGPTResponse(content);

    console.log('[ImageAnalysis] 📋 Parsed AI Result:', JSON.stringify(parsedResult, null, 2));
    console.log('='.repeat(50));

    logger.info('Image authenticity analysis complete', {
      verdict: parsedResult.verdict,
      confidence: parsedResult.confidence,
    });

    return parsedResult;
  } catch (error) {
    console.error('[ImageAnalysis] OpenAI analysis error:', error.message);
    logger.error('OpenAI image analysis error', { error: error.message });
    return fallbackAnalysis(analysisData);
  }
};

/**
 * Analyzes an image directly using GPT-4o vision capabilities
 * @param {string} imageUrl - URL of the image to analyze
 * @param {string} imageBase64 - Base64 encoded image (alternative to URL)
 * @param {Object} context - Additional context about the image
 * @returns {Promise<{verdict: string, confidence: number, reasoning: string, details: Object}>}
 */
const analyzeImageWithVision = async (imageUrl, imageBase64 = null, context = {}) => {
  try {
    console.log('[ImageAnalysis] 🖼️ Vision Analysis Request:');
    console.log('[ImageAnalysis] Image URL:', imageUrl ? imageUrl.substring(0, 100) + '...' : 'N/A');
    console.log('[ImageAnalysis] Has Base64:', !!imageBase64);
    console.log('[ImageAnalysis] Context:', JSON.stringify(context, null, 2));

    const imageContent = imageBase64
      ? { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      : { type: 'image_url', image_url: { url: imageUrl } };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert digital forensics analyst specializing in image authenticity verification.

Conduct a rigorous visual and forensic analysis of the provided image. Look for:

1. **AI Generation Artifacts**:
   - Unnatural textures (skin, hair, background).
   - Asymmetry in faces, eyes, or accessories.
   - Garbled text or nonsensical background details.
   - "Plastic" or overly smooth skin appearance.
   - Typical AI style signatures (Midjourney lighting, DALL-E composition).

2. **Manipulation & Editing**:
   - Inconsistent lighting or shadows (shadows falling in different directions).
   - Mismatched noise patterns or resolution between objects (compositing).
   - Warping or distortion around edges (liquify tool).
   - Cloning artifacts (repeated patterns).
   - Unnatural color grading or filtering.

3. **Physical Inconsistencies**:
   - Reflections that don't match the environment.
   - Perspective errors.
   - Objects defying gravity or physics.

Provide your analysis in this exact format:
VERDICT: [AUTHENTIC/SUSPICIOUS/FAKE]
CONFIDENCE: [0-100]
REASONING: [Detailed explanation of specific findings]
AI_GENERATED: [YES/NO/UNCERTAIN]
MANIPULATION_SIGNS: [List specific artifacts found, e.g., "Mismatched shadows", "Garbled text"]`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image for authenticity.${context.caption ? `\n\nCaption provided: "${context.caption}"` : ''}${context.source ? `\nSource: ${context.source}` : ''}`,
            },
            imageContent,
          ],
        },
      ],
      temperature: 0.1,
      max_completion_tokens: 500,
    });

    const content = response.choices[0].message.content;

    console.log('[ImageAnalysis] 🤖 Vision AI Response:');
    console.log('-'.repeat(30));
    console.log(content);
    console.log('-'.repeat(30));

    const parsedResult = parseVisionResponse(content);

    console.log('[ImageAnalysis] 📋 Parsed Vision Result:', JSON.stringify(parsedResult, null, 2));

    logger.info('Image vision analysis complete', {
      verdict: parsedResult.verdict,
      confidence: parsedResult.confidence,
      aiGenerated: parsedResult.aiGenerated,
    });

    return parsedResult;
  } catch (error) {
    console.error('[ImageAnalysis] Vision analysis error:', error.message);
    logger.error('Vision analysis error', { error: error.message });
    return {
      verdict: 'SUSPICIOUS',
      confidence: 50,
      reasoning: 'Unable to analyze image: ' + error.message,
      aiGenerated: 'UNCERTAIN',
      manipulationSigns: [],
    };
  }
};

/**
 * Builds comprehensive analysis prompt with all available data
 */
function buildAnalysisPrompt(data) {
  const { media, projectContext, previousSubmissions } = data;

  let prompt = `Analyze this image submission for authenticity:\n\n`;

  // Media analysis
  prompt += `IMAGE DATA:\n`;
  if (media && Array.isArray(media)) {
    media.forEach((item, index) => {
      prompt += `Image ${index + 1}:\n`;
      prompt += `- SHA256: ${item.sha256 || 'N/A'}\n`;
      prompt += `- Perceptual Hash: ${item.pHash || 'N/A'}\n`;
      prompt += `- Watermarked: ${item.watermarked || 'Unknown'}\n`;

      if (item.exif) {
        prompt += `- EXIF Data:\n`;
        prompt += `  * DateTime: ${item.exif.DateTimeOriginal || 'Missing'}\n`;
        prompt += `  * GPS: ${item.exif.GPSLatitude
            ? `${item.exif.GPSLatitude}, ${item.exif.GPSLongitude}`
            : 'Missing'
          }\n`;
        prompt += `  * Camera: ${item.exif.Make || 'Unknown'} ${item.exif.Model || 'Unknown'}\n`;
        prompt += `  * Resolution: ${item.exif.ImageWidth || 'Unknown'}x${item.exif.ImageHeight || 'Unknown'}\n`;
      }
      prompt += `\n`;
    });
  }

  // Project context
  if (projectContext) {
    prompt += `PROJECT CONTEXT:\n`;
    prompt += `- Project ID: ${projectContext.projectId || 'N/A'}\n`;
    prompt += `- Expected Location: ${projectContext.expectedLocation || 'Unknown'}\n`;
    prompt += `- Project Type: ${projectContext.type || 'Unknown'}\n`;
    prompt += `- Submission Type: ${projectContext.submissionType || 'Unknown'}\n`;
    prompt += `\n`;
  }

  // Previous submissions for comparison
  if (previousSubmissions && previousSubmissions.length > 0) {
    prompt += `PREVIOUS SUBMISSIONS (for comparison):\n`;
    previousSubmissions.slice(0, 3).forEach((sub, index) => {
      prompt += `Submission ${index + 1}:\n`;
      prompt += `- Date: ${sub.createdAt}\n`;
      prompt += `- Trust Score: ${sub.trustScore}%\n`;
      prompt += `- Status: ${sub.status}\n`;
      if (sub.media && sub.media[0]) {
        prompt += `- Previous pHash: ${sub.media[0].pHash}\n`;
      }
    });
    prompt += `\n`;
  }

  // Trust flags
  if (data.trustFlags && data.trustFlags.length > 0) {
    prompt += `TRUST FLAGS:\n`;
    data.trustFlags.forEach((flag) => {
      prompt += `- ${flag}\n`;
    });
    prompt += `\n`;
  }

  prompt += `Based on this comprehensive data, provide your analysis in this exact format:
VERDICT: [AUTHENTIC/SUSPICIOUS/FAKE]
CONFIDENCE: [0-100]
REASONING: [Brief explanation]`;

  return prompt;
}

/**
 * Parses GPT response to extract structured data
 */
function parseGPTResponse(content) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);

  let verdict = 'SUSPICIOUS';
  let confidence = 50;
  let reasoning = 'Unable to parse response';

  for (const line of lines) {
    if (line.startsWith('VERDICT:')) {
      const v = line.split(':')[1]?.trim().toUpperCase();
      if (['AUTHENTIC', 'SUSPICIOUS', 'FAKE'].includes(v)) {
        verdict = v;
      }
    } else if (line.startsWith('CONFIDENCE:')) {
      const c = parseInt(line.split(':')[1]?.trim());
      if (!isNaN(c) && c >= 0 && c <= 100) {
        confidence = c;
      }
    } else if (line.startsWith('REASONING:')) {
      reasoning = line.split(':').slice(1).join(':').trim() || 'No reasoning provided';
    }
  }

  return { verdict, confidence, reasoning };
}

/**
 * Parses Vision API response to extract structured data
 */
function parseVisionResponse(content) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);

  let verdict = 'SUSPICIOUS';
  let confidence = 50;
  let reasoning = 'Unable to parse response';
  let aiGenerated = 'UNCERTAIN';
  let manipulationSigns = [];

  for (const line of lines) {
    if (line.startsWith('VERDICT:')) {
      const v = line.split(':')[1]?.trim().toUpperCase();
      if (['AUTHENTIC', 'SUSPICIOUS', 'FAKE'].includes(v)) {
        verdict = v;
      }
    } else if (line.startsWith('CONFIDENCE:')) {
      const c = parseInt(line.split(':')[1]?.trim());
      if (!isNaN(c) && c >= 0 && c <= 100) {
        confidence = c;
      }
    } else if (line.startsWith('REASONING:')) {
      reasoning = line.split(':').slice(1).join(':').trim() || 'No reasoning provided';
    } else if (line.startsWith('AI_GENERATED:')) {
      const ag = line.split(':')[1]?.trim().toUpperCase();
      if (['YES', 'NO', 'UNCERTAIN'].includes(ag)) {
        aiGenerated = ag;
      }
    } else if (line.startsWith('MANIPULATION_SIGNS:')) {
      const signs = line.split(':').slice(1).join(':').trim();
      if (signs && signs.toLowerCase() !== 'none') {
        manipulationSigns = signs.split(',').map((s) => s.trim()).filter((s) => s);
      }
    }
  }

  return { verdict, confidence, reasoning, aiGenerated, manipulationSigns };
}

/**
 * Fallback analysis when OpenAI is unavailable
 */
function fallbackAnalysis(data) {
  const { trustFlags } = data;

  let verdict = 'AUTHENTIC';
  let confidence = 80;
  let reasoning = 'Basic analysis completed';

  if (trustFlags) {
    const criticalFlags = ['NO_GPS', 'GPS_OUTSIDE_POLYGON', 'PHASH_SIMILAR'];
    const hasCritical = trustFlags.some((flag) => criticalFlags.includes(flag));

    if (hasCritical) {
      verdict = 'SUSPICIOUS';
      confidence = 60;
      reasoning = 'Critical trust flags detected';
    }

    if (trustFlags.includes('NO_GPS') && trustFlags.includes('NO_EXIF_TIME')) {
      verdict = 'FAKE';
      confidence = 30;
      reasoning = 'Missing critical metadata';
    }
  }

  return { verdict, confidence, reasoning };
}

/**
 * Batch analysis for multiple images
 */
const analyzeBatchAuthenticity = async (submissions) => {
  try {
    const results = await Promise.all(
      submissions.map(async (submission) => {
        const analysis = await analyzeImageAuthenticity(submission);
        return {
          submissionId: submission.id,
          ...analysis,
        };
      })
    );
    return results;
  } catch (error) {
    console.error('[ImageAnalysis] Batch analysis error:', error);
    logger.error('Batch analysis error', { error: error.message });
    throw error;
  }
};

module.exports = {
  analyzeImageAuthenticity,
  analyzeImageWithVision,
  analyzeBatchAuthenticity,
};

