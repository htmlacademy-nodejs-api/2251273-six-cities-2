import { Command } from './command.interface.js';
import { TSVOfferGenerator } from '../../shared/libs/offer-generator/index.js';
import { TSVFileWriter } from '../../shared/libs/file-writer/index.js';
import got from 'got';
import { TSV_FIELDS_OFFER } from '../../shared/const.js';

export class GenerateCommand implements Command {
  // Получаем имя команды
  getName(): string {
    return '--generate';
  }

  // Выполняем команду
  async execute(...args: string[]): Promise<void> {
    const [countStr, filePath, url] = args;
    const count = parseInt(countStr, 10);

    // Проверяем наличие аргументов
    if (!count || !filePath || !url) {
      console.error('Missing required arguments');
      console.error('Usage: --generate <count> <filepath> <url>');
      return; // ⚠️ ВАЖНО: прерываем выполнение, иначе код пойдет дальше с undefined
    }

    try {
      console.info(`Downloading data from ${url}...`);
      // Получаем данные из url
      const mockData = JSON.parse((await got(url)).body);

      // Создаем экземпляр класса TSVFileWriter для записи в файл
      const writer = new TSVFileWriter(filePath);

      // Записываем заголовки
      await writer.write(TSV_FIELDS_OFFER.join('\t'));

      // Создаем экземпляр класса TSVOfferGenerator для генерации данных
      const generator = new TSVOfferGenerator(mockData);
      console.info(`Generating ${count} offers...`);

      for (let i = 0; i < count; i++) {
        // Записываем сгенерированные данные
        await writer.write(generator.generate());
      }

      // Закрываем файл
      await writer.close();
      console.info(`✅ Generated ${count} offers to ${filePath}`);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // ✅ ИСПРАВЛЕНИЕ: передаем Error или string первым аргументом, согласно LoggerInterface
      if (err instanceof Error) {
        // Pino автоматически извлечет stack trace, если первым аргументом идет объект Error
        console.error(err, `ERROR: ${msg}`);
      } else {
        // Если это не объект Error, передаем просто строку
        console.error(`ERROR: ${msg}`);
      }
    }
  }
}
