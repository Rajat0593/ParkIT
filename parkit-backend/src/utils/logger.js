const fs = require('fs');
const path = require('path');
const config = require('../config/environment');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const getLogLevel = (level) => LOG_LEVELS[level] || 2;

class Logger {
  constructor() {
    this.level = getLogLevel(config.LOGGING.LEVEL);
    this.logFile = config.LOGGING.FILE;
  }

  log(message, level = 'info', meta = {}) {
    if (getLogLevel(level) > this.level) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    const logEntry = JSON.stringify(logMessage);

    // Console output
    const consoleOutput = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](consoleOutput);

    // File output
    if (this.logFile) {
      fs.appendFileSync(this.logFile, logEntry + '\n', (err) => {
        if (err) console.error('Failed to write to log file:', err);
      });
    }
  }

  error(message, meta = {}) {
    this.log(message, 'error', meta);
  }

  warn(message, meta = {}) {
    this.log(message, 'warn', meta);
  }

  info(message, meta = {}) {
    this.log(message, 'info', meta);
  }

  debug(message, meta = {}) {
    this.log(message, 'debug', meta);
  }
}

module.exports = new Logger();
