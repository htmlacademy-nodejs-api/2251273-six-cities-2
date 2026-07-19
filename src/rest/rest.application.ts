import { LoggerInterface } from '../shared/libs/logger/logger.interface.js';
import { RestConfig } from './../shared/libs/config/config.index.js';

export class RestApplication {
  constructor(
    private readonly logger: LoggerInterface,
    private readonly config: RestConfig
  ) {}

  public async init() {
    // Используем значения из .env через конфиг
    const port = this.config.get('port');
    const logLevel = this.config.get('logLevel');

    this.logger.info(`Rest application started on port ${port}`);
    this.logger.info(`Active log level: ${logLevel}`);
  }
}
