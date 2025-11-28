/**
 * Blockchain Service
 * 
 * Handles immutable storage of verification results on blockchain.
 * Supports Polygon and Solana with abstraction for easy provider swapping.
 * 
 * IMPORTANT: Only stores hash + minimal metadata on-chain.
 * Full graph data is stored off-chain in the database.
 */

const { ethers } = require('ethers');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Simple storage contract ABI (for Polygon/EVM chains)
const STORAGE_ABI = [
  'function storeVerification(bytes32 graphHash, string calldata verdict, uint256 timestamp) external',
  'function getVerification(bytes32 graphHash) external view returns (string memory verdict, uint256 timestamp, address verifier)',
  'event VerificationStored(bytes32 indexed graphHash, string verdict, uint256 timestamp, address verifier)'
];

class BlockchainService {
  constructor() {
    this.provider = process.env.BLOCKCHAIN_PROVIDER || 'polygon';
    this.rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    this.contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
    this.dryRun = process.env.BLOCKCHAIN_DRY_RUN === 'true';

    this.initialized = false;
    this.evmProvider = null;
    this.evmWallet = null;
    this.solanaConnection = null;
    this.solanaKeypair = null;

    logger.info(`Blockchain service configured`, {
      provider: this.provider,
      dryRun: this.dryRun,
      hasRpc: !!this.rpcUrl,
      hasKey: !!this.privateKey
    });
  }

  /**
   * Initialize blockchain connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      if (this.provider === 'polygon' || this.provider === 'ethereum') {
        await this.initializeEVM();
      } else if (this.provider === 'solana') {
        await this.initializeSolana();
      } else {
        throw new Error(`Unsupported blockchain provider: ${this.provider}`);
      }

      this.initialized = true;
      logger.info('Blockchain service initialized successfully');
    } catch (error) {
      logger.error('Blockchain initialization failed', { error: error.message });
      // Don't throw - allow service to run in degraded mode
    }
  }

  /**
   * Initialize EVM-compatible blockchain (Polygon/Ethereum)
   */
  async initializeEVM() {
    if (!this.rpcUrl) {
      throw new Error('BLOCKCHAIN_RPC_URL required for EVM chains');
    }

    this.evmProvider = new ethers.JsonRpcProvider(this.rpcUrl);
    
    if (this.privateKey && !this.dryRun) {
      this.evmWallet = new ethers.Wallet(this.privateKey, this.evmProvider);
      const balance = await this.evmProvider.getBalance(this.evmWallet.address);
      logger.info('EVM wallet initialized', { 
        address: this.evmWallet.address,
        balance: ethers.formatEther(balance)
      });
    }
  }

  /**
   * Initialize Solana blockchain
   */
  async initializeSolana() {
    if (!this.rpcUrl) {
      throw new Error('BLOCKCHAIN_RPC_URL required for Solana');
    }

    this.solanaConnection = new Connection(this.rpcUrl, 'confirmed');
    
    if (this.privateKey && !this.dryRun) {
      const secretKey = Buffer.from(this.privateKey, 'base64');
      this.solanaKeypair = Keypair.fromSecretKey(secretKey);
      const balance = await this.solanaConnection.getBalance(this.solanaKeypair.publicKey);
      logger.info('Solana wallet initialized', { 
        address: this.solanaKeypair.publicKey.toString(),
        balance: balance / 1e9 // Convert lamports to SOL
      });
    }
  }

  /**
   * Store verification hash on blockchain
   * @param {Object} data - Verification data to store
   * @param {string} data.graphHash - Hash of the source graph
   * @param {string} data.verdict - Verification verdict
   * @param {number} data.timestamp - Unix timestamp
   * @param {Object} data.metadata - Additional metadata
   * @returns {Promise<Object>} Transaction result
   */
  async storeVerification(data) {
    const { graphHash, verdict, timestamp, metadata = {} } = data;

    logger.info('Storing verification on blockchain', {
      provider: this.provider,
      graphHash,
      verdict,
      dryRun: this.dryRun
    });

    if (this.dryRun) {
      return this.simulateStore(data);
    }

    await this.initialize();

    if (this.provider === 'polygon' || this.provider === 'ethereum') {
      return this.storeOnEVM(graphHash, verdict, timestamp);
    } else if (this.provider === 'solana') {
      return this.storeOnSolana(graphHash, verdict, timestamp, metadata);
    }

    throw new Error(`Storage not implemented for provider: ${this.provider}`);
  }

  /**
   * Store verification on EVM chain
   */
  async storeOnEVM(graphHash, verdict, timestamp) {
    if (!this.evmWallet) {
      throw new Error('EVM wallet not initialized');
    }

    if (!this.contractAddress) {
      // If no contract, store as data in a transaction
      const data = ethers.toUtf8Bytes(JSON.stringify({
        type: 'SATYATRAIL_VERIFICATION',
        graphHash,
        verdict,
        timestamp
      }));

      const tx = await this.evmWallet.sendTransaction({
        to: this.evmWallet.address, // Self-transaction with data
        value: 0,
        data: ethers.hexlify(data)
      });

      const receipt = await tx.wait();

      return {
        success: true,
        provider: this.provider,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        graphHash,
        verdict,
        timestamp: new Date(timestamp).toISOString(),
        gasUsed: receipt.gasUsed.toString()
      };
    }

    // Use smart contract
    const contract = new ethers.Contract(
      this.contractAddress,
      STORAGE_ABI,
      this.evmWallet
    );

    const graphHashBytes = ethers.id(graphHash);
    const tx = await contract.storeVerification(graphHashBytes, verdict, timestamp);
    const receipt = await tx.wait();

    return {
      success: true,
      provider: this.provider,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractAddress: this.contractAddress,
      graphHash,
      verdict,
      timestamp: new Date(timestamp).toISOString(),
      gasUsed: receipt.gasUsed.toString()
    };
  }

  /**
   * Store verification on Solana
   */
  async storeOnSolana(graphHash, verdict, timestamp, metadata) {
    if (!this.solanaKeypair) {
      throw new Error('Solana keypair not initialized');
    }

    // Create memo instruction with verification data
    const memoData = JSON.stringify({
      type: 'SATYATRAIL_VERIFICATION',
      graphHash,
      verdict,
      timestamp
    });

    // For Solana, we'll use a simple transfer with memo
    // In production, you'd use a proper program
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.solanaKeypair.publicKey,
        toPubkey: this.solanaKeypair.publicKey,
        lamports: 0
      })
    );

    // Add memo (requires @solana/spl-memo in production)
    transaction.recentBlockhash = (await this.solanaConnection.getLatestBlockhash()).blockhash;
    transaction.feePayer = this.solanaKeypair.publicKey;

    const signature = await this.solanaConnection.sendTransaction(
      transaction,
      [this.solanaKeypair]
    );

    await this.solanaConnection.confirmTransaction(signature);

    return {
      success: true,
      provider: 'solana',
      transactionHash: signature,
      graphHash,
      verdict,
      timestamp: new Date(timestamp).toISOString()
    };
  }

  /**
   * Simulate blockchain storage (dry run mode)
   */
  simulateStore(data) {
    const simulatedHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data) + Date.now())
      .digest('hex');

    logger.info('Simulated blockchain storage (dry run)', { simulatedHash });

    return {
      success: true,
      provider: this.provider,
      transactionHash: `0x${simulatedHash}`,
      blockNumber: Math.floor(Math.random() * 1000000),
      graphHash: data.graphHash,
      verdict: data.verdict,
      timestamp: new Date(data.timestamp).toISOString(),
      dryRun: true,
      note: 'This is a simulated transaction. Set BLOCKCHAIN_DRY_RUN=false for real transactions.'
    };
  }

  /**
   * Retrieve verification from blockchain
   * @param {string} graphHash - Hash to look up
   * @returns {Promise<Object|null>} Verification data or null
   */
  async getVerification(graphHash) {
    if (this.dryRun) {
      logger.info('Verification lookup skipped (dry run mode)');
      return null;
    }

    await this.initialize();

    if ((this.provider === 'polygon' || this.provider === 'ethereum') && this.contractAddress) {
      const contract = new ethers.Contract(
        this.contractAddress,
        STORAGE_ABI,
        this.evmProvider
      );

      const graphHashBytes = ethers.id(graphHash);
      const [verdict, timestamp, verifier] = await contract.getVerification(graphHashBytes);

      if (verdict) {
        return {
          graphHash,
          verdict,
          timestamp: new Date(Number(timestamp) * 1000).toISOString(),
          verifier
        };
      }
    }

    return null;
  }

  /**
   * Check if service is operational
   * @returns {Promise<Object>} Service status
   */
  async getStatus() {
    const status = {
      provider: this.provider,
      initialized: this.initialized,
      dryRun: this.dryRun,
      connected: false
    };

    try {
      await this.initialize();

      if (this.provider === 'polygon' || this.provider === 'ethereum') {
        const blockNumber = await this.evmProvider.getBlockNumber();
        status.connected = true;
        status.blockNumber = blockNumber;
        if (this.evmWallet) {
          status.walletAddress = this.evmWallet.address;
        }
      } else if (this.provider === 'solana') {
        const slot = await this.solanaConnection.getSlot();
        status.connected = true;
        status.slot = slot;
        if (this.solanaKeypair) {
          status.walletAddress = this.solanaKeypair.publicKey.toString();
        }
      }
    } catch (error) {
      status.error = error.message;
    }

    return status;
  }
}

// Export singleton instance
module.exports = new BlockchainService();

