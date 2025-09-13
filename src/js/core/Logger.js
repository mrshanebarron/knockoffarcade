/**
 * Enhanced logging system with multiple levels and enterprise features
 */
export class Logger {
  static LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
  };

  static LOG_LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

  constructor(name = 'Game', level = Logger.LOG_LEVELS.INFO) {
    this.name = name;
    this.level = level;
    this.logs = [];
    this.maxLogs = 1000;
    this.performance = new Map();
  }

  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {...any} data - Additional data
   */
  debug(message, ...data) {
    this._log(Logger.LOG_LEVELS.DEBUG, message, ...data);
  }

  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {...any} data - Additional data
   */
  info(message, ...data) {
    this._log(Logger.LOG_LEVELS.INFO, message, ...data);
  }

  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {...any} data - Additional data
   */
  warn(message, ...data) {
    this._log(Logger.LOG_LEVELS.WARN, message, ...data);
  }

  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Error|any} error - Error object or additional data
   * @param {...any} data - Additional data
   */
  error(message, error = null, ...data) {
    if (error instanceof Error) {
      this._log(Logger.LOG_LEVELS.ERROR, message, {
        error: error.message,
        stack: error.stack,
        ...data
      });
    } else {
      this._log(Logger.LOG_LEVELS.ERROR, message, error, ...data);
    }
  }

  /**
   * Log a fatal error message
   * @param {string} message - Log message
   * @param {Error|any} error - Error object or additional data
   * @param {...any} data - Additional data
   */
  fatal(message, error = null, ...data) {
    if (error instanceof Error) {
      this._log(Logger.LOG_LEVELS.FATAL, message, {
        error: error.message,
        stack: error.stack,
        ...data
      });
    } else {
      this._log(Logger.LOG_LEVELS.FATAL, message, error, ...data);
    }
  }

  /**
   * Start a performance timer
   * @param {string} label - Timer label
   */
  time(label) {
    this.performance.set(label, performance.now());
  }

  /**
   * End a performance timer and log the result
   * @param {string} label - Timer label
   */
  timeEnd(label) {
    if (!this.performance.has(label)) {
      this.warn(`Timer '${label}' does not exist`);
      return;
    }

    const start = this.performance.get(label);
    const duration = performance.now() - start;
    this.performance.delete(label);
    
    this.debug(`Timer '${label}': ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Log game state for debugging
   * @param {Object} gameState - Current game state
   */
  logGameState(gameState) {
    this.debug('Game State', {
      level: gameState.level,
      score: gameState.score,
      lives: gameState.lives,
      combo: gameState.combo,
      ballCount: gameState.balls?.length || 0,
      activePowerUps: Object.keys(gameState.paddle?.powerUps || {})
        .filter(key => gameState.paddle.powerUps[key] > Date.now())
    });
  }

  /**
   * Internal logging method
   * @private
   */
  _log(level, message, ...data) {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = Logger.LOG_LEVEL_NAMES[level];
    const logEntry = {
      timestamp,
      level: levelName,
      name: this.name,
      message,
      data: data.length > 0 ? data : undefined
    };

    // Add to internal log storage
    this.logs.push(logEntry);
    
    // Maintain max log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with styling
    const style = this._getConsoleStyle(level);
    const prefix = `[${timestamp}] [${levelName}] [${this.name}]`;
    
    if (data.length > 0) {
      console.group(`%c${prefix} ${message}`, style);
      data.forEach(item => console.log(item));
      console.groupEnd();
    } else {
      console.log(`%c${prefix} ${message}`, style);
    }
  }

  /**
   * Get console styling for log level
   * @private
   */
  _getConsoleStyle(level) {
    const styles = {
      [Logger.LOG_LEVELS.DEBUG]: 'color: #888; font-weight: normal;',
      [Logger.LOG_LEVELS.INFO]: 'color: #0066cc; font-weight: normal;',
      [Logger.LOG_LEVELS.WARN]: 'color: #ff8800; font-weight: bold;',
      [Logger.LOG_LEVELS.ERROR]: 'color: #cc0000; font-weight: bold;',
      [Logger.LOG_LEVELS.FATAL]: 'color: #ffffff; background-color: #cc0000; font-weight: bold; padding: 2px 4px;'
    };
    
    return styles[level] || '';
  }

  /**
   * Export logs as JSON
   * @returns {string} JSON string of logs
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Set logging level
   * @param {number} level - New logging level
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Get recent logs
   * @param {number} count - Number of recent logs to return
   * @returns {Array} Recent log entries
   */
  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }
}

// Global logger instance
export const logger = new Logger('SuperBreakout');

export default Logger;