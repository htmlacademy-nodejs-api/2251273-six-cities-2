import { PinoLogger } from './shared/libs/logger/pino.logger.js';
import { RestConfig } from './shared/libs/config/config.index.js';
import { RestApplication } from './rest/rest.application.js';

async function bootstrap() {
  const logger = new PinoLogger();

  try {
    // 1. Создаем конфиг (загрузит .env и провалидирует convict)
    const config = new RestConfig(logger);

    // 2. Создаем приложение, передавая зависимости
    const application = new RestApplication(logger, config);


    // 3. Запускаем
    await application.init();
  } catch (error) {
    logger.error('Fatal error during bootstrap:', error as Error);

    throw error;
  }
}

bootstrap();
