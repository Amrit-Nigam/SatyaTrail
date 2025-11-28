#!/usr/bin/env node

/**
 * Store Graph On Chain Script
 * 
 * Utility script to manually store a source graph hash on the blockchain.
 * Supports dry-run mode for testing.
 * 
 * Usage:
 *   node scripts/storeGraphOnChain.js <graph_hash> <verdict> [--dry-run]
 * 
 * Examples:
 *   node scripts/storeGraphOnChain.js abc123... true --dry-run
 *   node scripts/storeGraphOnChain.js abc123... false
 */

require('dotenv').config();

const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const dryRun = args.includes('--dry-run');
  const filteredArgs = args.filter(a => !a.startsWith('--'));
  
  const graphHash = filteredArgs[0];
  const verdict = filteredArgs[1];
  
  // Validate arguments
  if (!graphHash || !verdict) {
    console.log(`
Usage: node scripts/storeGraphOnChain.js <graph_hash> <verdict> [--dry-run]

Arguments:
  graph_hash   SHA-256 hash of the source graph (64 hex characters)
  verdict      Verification verdict: true, false, mixed, or unknown

Options:
  --dry-run    Simulate the transaction without actual blockchain write

Examples:
  node scripts/storeGraphOnChain.js abc123def456... true --dry-run
  node scripts/storeGraphOnChain.js abc123def456... false

Environment Variables Required:
  BLOCKCHAIN_PROVIDER      - 'polygon' or 'solana'
  BLOCKCHAIN_RPC_URL       - RPC endpoint URL
  BLOCKCHAIN_PRIVATE_KEY   - Private key for signing (not needed for dry-run)
    `);
    process.exit(1);
  }
  
  // Validate hash format
  if (!/^[a-f0-9]{64}$/i.test(graphHash)) {
    console.error('Error: graph_hash must be a 64-character hexadecimal string');
    process.exit(1);
  }
  
  // Validate verdict
  const validVerdicts = ['true', 'false', 'mixed', 'unknown'];
  if (!validVerdicts.includes(verdict.toLowerCase())) {
    console.error(`Error: verdict must be one of: ${validVerdicts.join(', ')}`);
    process.exit(1);
  }
  
  // Override dry run setting if flag provided
  if (dryRun) {
    process.env.BLOCKCHAIN_DRY_RUN = 'true';
  }
  
  console.log('\n=== SatyaTrail Blockchain Storage ===\n');
  console.log(`Graph Hash: ${graphHash}`);
  console.log(`Verdict: ${verdict}`);
  console.log(`Mode: ${dryRun || process.env.BLOCKCHAIN_DRY_RUN === 'true' ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Provider: ${process.env.BLOCKCHAIN_PROVIDER || 'polygon'}`);
  console.log('');
  
  try {
    console.log('Initializing blockchain service...');
    await blockchainService.initialize();
    
    console.log('Storing verification on chain...');
    const result = await blockchainService.storeVerification({
      graphHash,
      verdict: verdict.toLowerCase(),
      timestamp: Date.now(),
      metadata: {
        source: 'manual-script',
        scriptVersion: '1.0.0'
      }
    });
    
    console.log('\n=== Transaction Result ===\n');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no actual transaction was submitted.');
      console.log('To submit a real transaction, remove --dry-run flag and set BLOCKCHAIN_DRY_RUN=false');
    } else {
      console.log('\n✅ Transaction submitted successfully!');
      console.log(`Transaction Hash: ${result.transactionHash}`);
      if (result.blockNumber) {
        console.log(`Block Number: ${result.blockNumber}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('private key')) {
      console.log('\nHint: Make sure BLOCKCHAIN_PRIVATE_KEY is set in your .env file');
    }
    if (error.message.includes('RPC')) {
      console.log('\nHint: Make sure BLOCKCHAIN_RPC_URL is set correctly');
    }
    
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

