import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { existsSync, mkdirSync } from 'fs';

// 环境变量配置
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || './logs';
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '20m';
const LOG_MAX_FILES = process.env.LOG_MAX_FILES || '14d';
const LOG_DATE_PATTERN = process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD';

// 确保日志目录存在
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// 自定义日志格式
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

// 控制台格式（美化输出）
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// 创建文件轮转传输器
const fileTransport = new DailyRotateFile({
  filename: `${LOG_DIR}/app-%DATE%.log`,
  datePattern: LOG_DATE_PATTERN,
  zippedArchive: true,
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  format: logFormat,
  level: LOG_LEVEL,
});

// 错误日志单独文件
const errorTransport = new DailyRotateFile({
  filename: `${LOG_DIR}/error-%DATE%.log`,
  datePattern: LOG_DATE_PATTERN,
  zippedArchive: true,
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  format: logFormat,
  level: 'error',
});

// 控制台传输器
const consoleTransport = new transports.Console({
  format: consoleFormat,
  level: LOG_LEVEL,
});

// 创建 Winston logger
const logger: Logger = createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports: [
    fileTransport,
    errorTransport,
    consoleTransport,
  ],
  exitOnError: false,
});

// 监听文件轮转事件
fileTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename });
});

errorTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Error log file rotated', { oldFilename, newFilename });
});

// 监听错误事件
fileTransport.on('error', (error) => {
  console.error('File transport error:', error);
});

errorTransport.on('error', (error) => {
  console.error('Error file transport error:', error);
});

// 保存原始 console 方法
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// 替换全局 console 方法
console.log = (...args: any[]) => logger.info(args.join(' '));
console.info = (...args: any[]) => logger.info(args.join(' '));
console.warn = (...args: any[]) => logger.warn(args.join(' '));
console.error = (...args: any[]) => logger.error(args.join(' '));
console.debug = (...args: any[]) => logger.debug(args.join(' '));

// 恢复原始 console 的函数
export const restoreConsole = (): void => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
};

// 导出 logger 实例
export default logger;