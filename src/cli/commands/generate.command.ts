import { Command } from './command.interface.js';
import { TSVOfferGenerator } from '../../shared/libs/offer-generator/index.js';
import { TSVFileWriter } from '../../shared/libs/file-writer/index.js';
import { logger } from './../../shared/libs/logger/logger.index.js';
import got from 'got';
import { TSV_FIELDS_OFFER } from '../../shared/const.js';

export class GenerateCommand implements Command {
  // Получаем имя команды
  getName(): string {
    return '--generate';
  }

  // Выполняем команду
  async execute(...args: string[]): Promise<void> {
    // Получаем аргументы (количество, путь к файлу, url)
    const [countStr, filePath, url] = args;
    const count = parseInt(countStr, 10);

    // Проверяем наличие аргументов
    if (!count || !filePath || !url) {
      logger.error('Missing required arguments');
      logger.error('Usage: --generate <count> <filepath> <url>');
    }

    try {
      logger.info(`Downloading data from ${url}...`);
      // Получаем данные из url
      const mockData = JSON.parse((await got(url)).body);
      // Создаем экземпляр класса TSVFileWriter для записи в файл
      const writer = new TSVFileWriter(filePath);
      // Записываем заголовки
      await writer.write(TSV_FIELDS_OFFER.join('\t'));
      // Создаем экземпляр класса TSVOfferGenerator для генерации данных
      const generator = new TSVOfferGenerator(mockData);
      logger.info(`Generating ${count} offers...`);
      for (let i = 0; i < count; i++) {
        // Записываем сгенерированные данные
        await writer.write(generator.generate());
      }

      // Закрываем файл
      await writer.close();
      logger.info(`Generated ${count} offers to ${filePath}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err }, `ERROR: ${msg}`);
    }
  }
}
