import pino, { Logger as PinoInstance } from 'pino';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { LoggerInterface } from './logger.interface.js';

const logDir = resolve(process.cwd(), './logs');
mkdirSync(logDir, { recursive: true });

export class PinoLogger implements LoggerInterface {
  private readonly logger: PinoInstance;

  constructor() {
    this.logger = pino({
      transport: {
        targets: [
          {
            target: 'pino-pretty',
            options: {
              colorize: true,
              destination: 2,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname'
            },
          },
          {
            target: 'pino/file',
            options: { destination: resolve(logDir, 'cli-app.log') },
          }
        ]
      }
    });
  }

  public debug(message: string, ...args: unknown[]): void {
    const logFn = this.logger.debug.bind(this.logger) as unknown as (msg: string, ...rest: unknown[]) => void;
    logFn(message, ...args);
  }

  public info(message: string, ...args: unknown[]): void {
    const logFn = this.logger.info.bind(this.logger) as unknown as (msg: string, ...rest: unknown[]) => void;
    logFn(message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    const logFn = this.logger.warn.bind(this.logger) as unknown as (msg: string, ...rest: unknown[]) => void;
    logFn(message, ...args);
  }

  public error(errorOrMessage: Error | string, ...args: unknown[]): void {
    if (errorOrMessage instanceof Error) {
      const logFn = this.logger.error.bind(this.logger) as unknown as (err: Error, ...rest: unknown[]) => void;
      logFn(errorOrMessage, ...args);
    } else {
      const logFn = this.logger.error.bind(this.logger) as unknown as (msg: string, ...rest: unknown[]) => void;
      logFn(errorOrMessage, ...args);
    }
  }
}
