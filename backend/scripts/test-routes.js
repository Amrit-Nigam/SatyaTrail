/**
 * Backend Routes Test Script
 * 
 * Tests all API endpoints in the SatyaTrail backend.
 * Run with: node scripts/test-routes.js
 * 
 * Uses testMode=true for verification endpoints to skip external API calls.
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://satyatrail.onrender.com';
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

/**
 * Color logging functions
 */
const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  section: (msg) => console.log(`\n${COLORS.bright}${COLORS.cyan}${msg}${COLORS.reset}`),
  detail: (msg) => console.log(`${COLORS.gray}  ${msg}${COLORS.reset}`)
};

/**
 * Test helper function
 */
async function test(name, testFn, options = {}) {
  const { skip = false, expectError = false } = options;

  if (skip) {
    log.warn(`SKIP: ${name}`);
    results.skipped++;
    results.tests.push({ name, status: 'skipped' });
    return null;
  }

  try {
    log.info(`Testing: ${name}`);
    const result = await testFn();

    if (expectError && result.error) {
      log.success(`${name} - Expected error occurred`);
      results.passed++;
      results.tests.push({ name, status: 'passed', note: 'Expected error' });
      return result;
    }

    if (result.error && !expectError) {
      throw new Error(result.error);
    }

    log.success(`${name} - PASSED`);
    if (result.data) {
      log.detail(`Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
    }
    results.passed++;
    results.tests.push({ name, status: 'passed', data: result.data });
    return result;
  } catch (error) {
    log.error(`${name} - FAILED: ${error.message}`);
    if (error.response) {
      log.detail(`Status: ${error.response.status}`);
      log.detail(`Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
    return { error: error.message };
  }
}

/**
 * Make HTTP request
 */
async function request(method, endpoint, data = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    validateStatus: () => true // Don't throw on any status
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        error: error.message
      };
    }
    throw error;
  }
}

/**
 * Test Health Check
 */
async function testHealthCheck() {
  log.section('🏥 Health Check');

  await test('GET /health', async () => {
    const result = await request('GET', '/health');
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    if (!result.data.status || result.data.status !== 'healthy') {
      throw new Error('Health check status is not healthy');
    }
    return result;
  });
}

/**
 * Test Verify News Routes
 */
async function testVerifyNewsRoutes() {
  log.section('📰 Verify News Routes');

  let verificationHash = null;

  // Test POST /api/v1/verify
  await test('POST /api/v1/verify (with text)', async () => {
    const result = await request('POST', '/api/v1/verify', {
      text: 'The Earth is round and this is a verifiable fact that scientists have proven over centuries of research.',
      source: 'frontend',
      testMode: true // Use mock mode for testing
    });

    if (result.status !== 200 && result.status !== 201) {
      throw new Error(`Expected 200/201, got ${result.status}`);
    }

    if (result.data && result.data.source_graph?.hash) {
      verificationHash = result.data.source_graph.hash;
      log.detail(`Verification hash: ${verificationHash}`);
    }

    return result;
  });

  await test('POST /api/v1/verify (with URL)', async () => {
    const result = await request('POST', '/api/v1/verify', {
      url: 'https://example.com/news-article',
      source: 'frontend',
      testMode: true // Use mock mode for testing
    });

    if (result.status !== 200 && result.status !== 201) {
      throw new Error(`Expected 200/201, got ${result.status}`);
    }

    return result;
  });

  await test('POST /api/v1/verify (missing params)', async () => {
    const result = await request('POST', '/api/v1/verify', {
      source: 'frontend'
    });

    // Should return 400 for missing url/text
    if (result.status !== 400) {
      throw new Error(`Expected 400 for missing params, got ${result.status}`);
    }

    return result;
  }, { expectError: true });

  // Test GET /api/v1/verify/recent
  await test('GET /api/v1/verify/recent', async () => {
    const result = await request('GET', '/api/v1/verify/recent');

    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }

    if (!result.data.verifications || !Array.isArray(result.data.verifications)) {
      throw new Error('Response should have verifications array');
    }

    return result;
  });

  await test('GET /api/v1/verify/recent?limit=5', async () => {
    const result = await request('GET', '/api/v1/verify/recent?limit=5');

    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }

    return result;
  });

  // Test GET /api/v1/verify/stats
  await test('GET /api/v1/verify/stats', async () => {
    const result = await request('GET', '/api/v1/verify/stats');

    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }

    return result;
  });

  // Test GET /api/v1/verify/:hash
  // Test 1: Invalid hash format (not 64 hex chars) - should return 404
  await test('GET /api/v1/verify/:hash (invalid format)', async () => {
    const result = await request('GET', '/api/v1/verify/invalid-hash-12345');

    // Should return 404 for invalid hash format
    if (result.status !== 404) {
      throw new Error(`Expected 404 for invalid hash format, got ${result.status}`);
    }

    if (!result.data.message.includes('Invalid hash format')) {
      throw new Error('Should indicate invalid hash format');
    }

    return result;
  }, { expectError: true });

  // Test 2: Valid hash format but non-existent - should return 404
  await test('GET /api/v1/verify/:hash (valid format, not found)', async () => {
    // Valid 64-char hex hash that doesn't exist
    const fakeHash = 'a'.repeat(64);
    const result = await request('GET', `/api/v1/verify/${fakeHash}`);

    // Should return 404 for non-existent hash
    if (result.status !== 404) {
      throw new Error(`Expected 404 for non-existent hash, got ${result.status}`);
    }

    if (!result.data.message.includes('Verification not found')) {
      throw new Error('Should indicate verification not found');
    }

    return result;
  }, { expectError: true });

  // Note: In test mode (testMode: true), database saves are skipped,
  // so we can't test actual data retrieval. To test that, run in non-test mode.
  if (verificationHash) {
    log.detail(`Mock verification hash captured: ${verificationHash.substring(0, 16)}...`);
    log.detail('Note: Hash retrieval test skipped in test mode (no DB save)');
  }
}

/**
 * Test Extension Routes
 */
async function testExtensionRoutes() {
  log.section('🔌 Extension Routes');

  // Test GET /api/v1/verify/extension/status
  await test('GET /api/v1/verify/extension/status', async () => {
    const result = await request('GET', '/api/v1/verify/extension/status');

    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }

    if (!result.data.status) {
      throw new Error('Response should have status field');
    }

    return result;
  });

  // Test GET /api/v1/verify/extension/check
  await test('GET /api/v1/verify/extension/check?url=https://example.com', async () => {
    const result = await request('GET', '/api/v1/verify/extension/check?url=https://example.com');

    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }

    if (typeof result.data.found !== 'boolean') {
      throw new Error('Response should have found boolean field');
    }

    return result;
  });

  await test('GET /api/v1/verify/extension/check (missing url)', async () => {
    const result = await request('GET', '/api/v1/verify/extension/check');

    // Should return 400 for missing url
    if (result.status !== 400) {
      throw new Error(`Expected 400 for missing url, got ${result.status}`);
    }

    return result;
  }, { expectError: true });

  // Test POST /api/v1/verify/extension
  await test('POST /api/v1/verify/extension (with text)', async () => {
    const result = await request('POST', '/api/v1/verify/extension', {
      text: 'Quick verification test for the browser extension endpoint with enough characters.',
      testMode: true // Use mock mode for testing
    });

    if (result.status !== 200 && result.status !== 201) {
      throw new Error(`Expected 200/201, got ${result.status}`);
    }

    return result;
  });

  await test('POST /api/v1/verify/extension (with URL)', async () => {
    const result = await request('POST', '/api/v1/verify/extension', {
      url: 'https://example.com/article',
      testMode: true // Use mock mode for testing
    });

    if (result.status !== 200 && result.status !== 201) {
      throw new Error(`Expected 200/201, got ${result.status}`);
    }

    return result;
  });
}

/**
 * Test Webhook Routes
 */
async function testWebhookRoutes() {
  log.section('🔔 Webhook Routes');

  // Test GET /api/v1/webhook/telegram
  await test('GET /api/v1/webhook/telegram', async () => {
    const result = await request('GET', '/api/v1/webhook/telegram');

    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }

    if (result.data.platform !== 'telegram') {
      throw new Error('Response should indicate telegram platform');
    }

    return result;
  });

  // Test POST /api/v1/webhook/telegram
  await test('POST /api/v1/webhook/telegram', async () => {
    const result = await request('POST', '/api/v1/webhook/telegram', {
      update_id: 12345,
      message: {
        message_id: 1,
        from: { id: 123, first_name: 'Test' },
        chat: { id: 123, type: 'private' },
        text: '/start'
      }
    });

    // Should return 200 (webhooks typically return 200 even on errors)
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }

    return result;
  });

  // Test GET /api/v1/webhook/twitter (CRC validation)
  await test('GET /api/v1/webhook/twitter (CRC validation)', async () => {
    const result = await request('GET', '/api/v1/webhook/twitter?crc_token=test-token-123');

    // May return 200 with response_token or 500 if not configured
    if (result.status === 500 && result.data.error === 'Configuration error') {
      log.warn('Twitter webhook not configured (expected)');
      return result;
    }

    if (result.status === 200 && !result.data.response_token) {
      throw new Error('Response should have response_token for valid CRC');
    }

    return result;
  });

  await test('GET /api/v1/webhook/twitter (missing crc_token)', async () => {
    const result = await request('GET', '/api/v1/webhook/twitter');

    // Should return 400 for missing crc_token
    if (result.status !== 400) {
      throw new Error(`Expected 400 for missing crc_token, got ${result.status}`);
    }

    return result;
  }, { expectError: true });

  // Test POST /api/v1/webhook/twitter
  await test('POST /api/v1/webhook/twitter', async () => {
    const result = await request('POST', '/api/v1/webhook/twitter', {
      for_user_id: '12345',
      tweet_create_events: [{
        id: '123456789',
        text: 'Test tweet',
        user: { id: '12345', screen_name: 'testuser' }
      }]
    });

    // Should return 200 (webhooks typically return 200 even on errors)
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }

    return result;
  });
}

/**
 * Test 404 handler
 */
async function test404Handler() {
  log.section('❌ Error Handling');

  await test('GET /nonexistent-route (404)', async () => {
    const result = await request('GET', '/nonexistent-route');

    if (result.status !== 404) {
      throw new Error(`Expected 404, got ${result.status}`);
    }

    if (!result.data.error || result.data.error !== 'Not Found') {
      throw new Error('Response should indicate Not Found error');
    }

    return result;
  }, { expectError: true });
}

/**
 * Print summary
 */
function printSummary() {
  log.section('📊 Test Summary');

  const total = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  console.log(`\n${COLORS.bright}Total Tests:${COLORS.reset} ${total}`);
  console.log(`${COLORS.green}Passed:${COLORS.reset} ${results.passed}`);
  console.log(`${COLORS.red}Failed:${COLORS.reset} ${results.failed}`);
  console.log(`${COLORS.yellow}Skipped:${COLORS.reset} ${results.skipped}`);
  console.log(`${COLORS.cyan}Pass Rate:${COLORS.reset} ${passRate}%\n`);

  if (results.failed > 0) {
    log.error('Failed Tests:');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => {
        console.log(`  - ${t.name}`);
        if (t.error) {
          log.detail(`    Error: ${t.error}`);
        }
      });
  }

  if (results.failed === 0) {
    log.success('All tests passed! 🎉');
  } else {
    log.warn('Some tests failed. Check the output above for details.');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${COLORS.bright}${COLORS.cyan}
╔══════════════════════════════════════════════════════════╗
║         SatyaTrail Backend Routes Test Suite            ║
╚══════════════════════════════════════════════════════════╝
${COLORS.reset}`);

  log.info(`Testing backend at: ${BASE_URL}\n`);

  try {
    // Check if server is reachable
    try {
      await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      log.success('Server is reachable\n');
    } catch (error) {
      log.error(`Cannot reach server at ${BASE_URL}`);
      log.error('Make sure the backend server is running!');
      log.error('Start it with: npm start or npm run dev');
      process.exit(1);
    }

    // Run all test suites
    await testHealthCheck();
    await testVerifyNewsRoutes();
    await testExtensionRoutes();
    await testWebhookRoutes();
    await test404Handler();

    // Print summary
    printSummary();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();

