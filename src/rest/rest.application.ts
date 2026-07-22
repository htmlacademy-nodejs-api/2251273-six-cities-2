import { LoggerInterface } from '../shared/libs/logger/logger.interface.js';
import { RestConfig } from './../shared/libs/config/config.index.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../shared/libs/container/container.types.js';

@injectable()
export class RestApplication {

  constructor(
    @inject(TYPES.Logger) private readonly logger: LoggerInterface,
    @inject(TYPES.Config) private readonly config: RestConfig
  ) {}

  public async init(): Promise<void> {
    const port = this.config.get('port');
    const logLevel = this.config.get('logLevel');

    this.logger.info(`🚀 Rest application started on port ${port}`);
    this.logger.info(`⚙️ Active log level: ${logLevel}`);
  }
}
