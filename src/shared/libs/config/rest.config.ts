import * as dotenv from 'dotenv';
import { configRestSchema, RestSchema } from './config.index.js';
import { LoggerInterface } from './../logger/logger.index.js';

export class RestConfig {
  private readonly config: RestSchema;

  constructor(private readonly logger: LoggerInterface) {
    const parsedOutput = dotenv.config();

    if (parsedOutput.error) {
      this.logger.warn('.env file not found or failed to parse. Using defaults.');
    }

    configRestSchema.load({});

    try {
      configRestSchema.validate({ allowed: 'strict' });
      this.logger.info('✅ Configuration loaded and validated successfully!');
    } catch (error) {
      this.logger.error(error as Error, '❌ Configuration validation failed');
      throw error;
    }

    this.config = configRestSchema.getProperties();

    // ✅ Вызываем метод для вывода значений в консоль
    this.logConfig();
  }

  public get<T extends keyof RestSchema>(key: T): RestSchema[T] {
    return this.config[key];
  }

  private logConfig(): void {
    this.logger.info('Loaded environment variables:');

    // Проходимся по всем ключам и значениям объекта config
    const entries = Object.entries(this.config) as [keyof RestSchema, RestSchema[keyof RestSchema]][];

    for (const [key, value] of entries) {
      // Выводим в формате "ключ: значение"
      this.logger.info(`   - ${key}: ${String(value)}`);
    }
  }
}
