/**
 * SatyaTrail Backend Server
 * 
 * AI-powered news verification system with:
 * - Multi-agent orchestration (TOI, IndiaTimes, NDTV, Generic agents)
 * - Tavily Search for web browsing
 * - OpenAI GPT-5 for reasoning
 * - Blockchain storage for immutability
 * - Telegram and Twitter bot integrations
 */

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const corsMiddleware = require('./utils/cors');
const logger = require('./utils/logger');
const verifyNewsRoutes = require('./routes/verifyNews');
const extensionRoutes = require('./routes/extension');
const telegramWebhook = require('./routes/webhooks/telegramWebhook');
const twitterWebhook = require('./routes/webhooks/twitterWebhook');

// Validate critical environment variables
const validateEnvironment = () => {
  const required = [
    'OPENAI_API_KEY',
    'TAVILY_API_KEY',
    'DATABASE_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Model name check (defaults to gpt-4o if not specified)
  const modelName = process.env.MODEL_NAME || 'gpt-4o';
  logger.info(`Using AI model: ${modelName}`);
};

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      model: process.env.MODEL_NAME
    }
  });
});

// API Routes
app.use('/api/v1/verify', verifyNewsRoutes);
app.use('/api/v1/verify/extension', extensionRoutes);
app.use('/api/v1/webhook/telegram', telegramWebhook);
app.use('/api/v1/webhook/twitter', twitterWebhook);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// Database connection
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('Connected to MongoDB database');
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize bots (non-blocking)
const initializeBots = async () => {
  // Initialize bots in parallel with timeout
  const botPromises = [];

  // Initialize Telegram bot
  if (process.env.TELEGRAM_BOT_TOKEN) {
    botPromises.push(
      (async () => {
        try {
          const telegramBot = require('./telegram/bot');
          await Promise.race([
            telegramBot.initialize(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Telegram bot initialization timeout')), 10000)
            )
          ]);
          logger.info('Telegram bot initialized');
        } catch (error) {
          logger.warn('Telegram bot initialization failed:', error.message);
        }
      })()
    );
  }

  // Initialize Twitter bot
  if (process.env.TWITTER_BEARER_TOKEN) {
    botPromises.push(
      (async () => {
        try {
          const twitterBot = require('./twitter/bot');
          await Promise.race([
            twitterBot.initialize(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Twitter bot initialization timeout')), 10000)
            )
          ]);
          logger.info('Twitter bot initialized');
        } catch (error) {
          logger.warn('Twitter bot initialization failed:', error.message);
        }
      })()
    );
  }

  // Wait for all bot initializations (but don't block server start)
  if (botPromises.length > 0) {
    await Promise.allSettled(botPromises);
  }
};

// Start server
const startServer = async () => {
  try {
    validateEnvironment();
    logger.info('Environment validation passed');
    
    await connectDatabase();
    logger.info('Database connection established');
    
    // Initialize bots but don't block server start
    logger.info('Initializing bots...');
    initializeBots().catch(error => {
      logger.warn('Bot initialization error (non-blocking):', error.message);
    });

    // Start server immediately
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      logger.info(`SatyaTrail backend server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;

