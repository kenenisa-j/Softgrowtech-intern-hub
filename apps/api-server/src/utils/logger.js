const pino = require('pino');

// Determine if we are running in production environment
const isProduction = process.env.NODE_ENV === 'production';

const transport = !isProduction ? {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
    ignore: 'pid,hostname',
  }
} : undefined;

let logger;
try {
  logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
  }, transport ? pino.transport(transport) : undefined);
} catch (e) {
  // Graceful fallback without pino-pretty if not installed or throwing
  logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
  });
}

module.exports = logger;
