import { Command } from './command.interface.js';
import { TSVOfferGenerator } from '../../shared/libs/offer-generator/index.js';
import { TSVFileWriter } from '../../shared/libs/file-writer/index.js';
import got from 'got';
import chalk from 'chalk';
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
      return console.error(chalk.red('❌ Usage: --generate <count> <filepath> <url>'));
    }

    try {
      // Получаем данные из url
      const mockData = JSON.parse((await got(url)).body);
      // Создаем экземпляр класса TSVFileWriter для записи в файл
      const writer = new TSVFileWriter(filePath);
      // Записываем заголовки
      await writer.write(TSV_FIELDS_OFFER.join('\t'));
      // Создаем экземпляр класса TSVOfferGenerator для генерации данных
      const generator = new TSVOfferGenerator(mockData);
      for (let i = 0; i < count; i++) {
        // Записываем сгенерированные данные
        await writer.write(generator.generate());
      }

      // Закрываем файл
      await writer.close();
      console.info(chalk.green(`✅ Generated ${count} offers to ${filePath}`));

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`❌ ERROR: ${msg}`));
    }
  }
}
