export interface LoggerInterface {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(errorOrMessage: Error | string, message?: string): void;
}
