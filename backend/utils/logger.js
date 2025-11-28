/**
 * Logger Utility
 * 
 * Structured logging with Winston.
 * High observability for agent runs and blockchain writes.
 */

const winston = require('winston');
const path = require('path');

// Custom format for structured logging
const structuredFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let metaStr = '';
  if (Object.keys(metadata).length > 0) {
    metaStr = ' ' + JSON.stringify(metadata);
  }
  return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    structuredFormat
  ),
  defaultMeta: { service: 'satyatrail-backend' },
  transports: [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        structuredFormat
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

// Specialized logging methods for high-observability components

/**
 * Log agent run with structured data
 */
logger.agentRun = function(agentName, action, data = {}) {
  this.info(`Agent: ${agentName} - ${action}`, {
    component: 'agent',
    agent: agentName,
    ...data
  });
};

/**
 * Log blockchain operation
 */
logger.blockchain = function(operation, data = {}) {
  this.info(`Blockchain: ${operation}`, {
    component: 'blockchain',
    ...data
  });
};

/**
 * Log orchestrator activity
 */
logger.orchestrator = function(action, data = {}) {
  this.info(`Orchestrator: ${action}`, {
    component: 'orchestrator',
    ...data
  });
};

/**
 * Log Tavily search operation
 */
logger.tavily = function(operation, data = {}) {
  this.info(`Tavily: ${operation}`, {
    component: 'tavily',
    ...data
  });
};

/**
 * Log verification request
 */
logger.verification = function(action, data = {}) {
  this.info(`Verification: ${action}`, {
    component: 'verification',
    ...data
  });
};

/**
 * Log bot activity (Telegram/Twitter)
 */
logger.bot = function(platform, action, data = {}) {
  this.info(`Bot [${platform}]: ${action}`, {
    component: 'bot',
    platform,
    ...data
  });
};

/**
 * Log API request
 */
logger.api = function(method, path, data = {}) {
  this.info(`API: ${method} ${path}`, {
    component: 'api',
    method,
    path,
    ...data
  });
};

/**
 * Log performance metrics
 */
logger.performance = function(operation, durationMs, data = {}) {
  this.info(`Performance: ${operation} completed in ${durationMs}ms`, {
    component: 'performance',
    operation,
    durationMs,
    ...data
  });
};

module.exports = logger;

