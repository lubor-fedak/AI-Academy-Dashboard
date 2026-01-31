/**
 * Structured logging utility for the AI Academy Dashboard
 * Provides consistent logging format across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  correlationId?: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Environment-based log level
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const isProduction = process.env.NODE_ENV === 'production';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
}

function formatLogEntry(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production (better for log aggregation)
    return JSON.stringify(entry);
  }
  // Human-readable format for development
  const { timestamp, level, message, context, error } = entry;
  let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  if (context && Object.keys(context).length > 0) {
    output += ` | ${JSON.stringify(context)}`;
  }
  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }
  return output;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'ai-academy-dashboard',
    environment: process.env.NODE_ENV || 'development',
  };

  if (context) {
    // Extract correlationId if present
    if (context.correlationId) {
      entry.correlationId = String(context.correlationId);
      const rest = { ...context };
      delete rest.correlationId;
      if (Object.keys(rest).length > 0) {
        entry.context = rest;
      }
    } else {
      entry.context = context;
    }
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) return;

  const entry = createLogEntry(level, message, context, error);
  const formatted = formatLogEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'debug':
      console.debug(formatted);
      break;
    default:
      console.log(formatted);
  }
}

// Main logger object
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext, error?: Error) => log('error', message, context, error),
};

// API request logger
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context?: LogContext
): void {
  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  log(level, `${method} ${path} ${statusCode}`, {
    method,
    path,
    statusCode,
    durationMs,
    ...context,
  });
}

// Cron job logger
export function logCronJob(
  jobName: string,
  status: 'started' | 'completed' | 'failed',
  context?: LogContext,
  error?: Error
): void {
  const level: LogLevel = status === 'failed' ? 'error' : 'info';
  log(level, `Cron [${jobName}] ${status}`, { jobName, status, ...context }, error);
}

// Database operation logger
export function logDbOperation(
  operation: string,
  table: string,
  durationMs?: number,
  context?: LogContext,
  error?: Error
): void {
  const level: LogLevel = error ? 'error' : 'debug';
  log(level, `DB ${operation} on ${table}`, { operation, table, durationMs, ...context }, error);
}

// Email operation logger
export function logEmailOperation(
  operation: 'sent' | 'failed',
  recipient: string,
  subject: string,
  error?: Error
): void {
  const level: LogLevel = operation === 'failed' ? 'error' : 'info';
  log(level, `Email ${operation}: ${subject}`, { recipient, subject }, error);
}

// Security event logger
export function logSecurityEvent(
  event: 'auth_success' | 'auth_failure' | 'rate_limited' | 'unauthorized' | 'forbidden',
  context?: LogContext
): void {
  const level: LogLevel = event === 'auth_success' ? 'info' : 'warn';
  log(level, `Security: ${event}`, { securityEvent: event, ...context });
}

// Generate correlation ID for request tracing
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default logger;
