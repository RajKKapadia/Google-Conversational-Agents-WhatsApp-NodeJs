type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levelWeight: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const currentLevel: LogLevel = (configuredLevel in levelWeight
  ? configuredLevel
  : 'info') as LogLevel;

function shouldLog(level: LogLevel): boolean {
  return levelWeight[level] <= levelWeight[currentLevel];
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: error };
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context || {}),
  };

  console.log(JSON.stringify(payload));
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    writeLog('debug', message, context);
  },
  info(message: string, context?: Record<string, unknown>) {
    writeLog('info', message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    writeLog('warn', message, context);
  },
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    writeLog('error', message, {
      ...(context || {}),
      ...(error ? { error: serializeError(error) } : {}),
    });
  },
};
