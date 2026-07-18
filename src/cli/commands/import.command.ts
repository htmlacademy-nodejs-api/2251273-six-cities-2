import { Command } from './command.interface.js';
import { TSVFileReader } from '../../shared/libs/file-reader/index.js';
import { TSVParser } from '../../shared/libs/tsv-parser/index.js';
import chalk from 'chalk';

export class ImportCommand implements Command {
  // Получение имени команды.
  public getName(): string {
    return '--import';
  }

  // Выполнение команды.
  public async execute(...parameters: string[]): Promise<void> {
    // Получение имени файла.(первый параметр, путь к файлу)
    const filename = parameters[0]?.trim();

    // Проверка наличия имени файла.
    if (!filename) {
      console.error(chalk.red('❌ ERROR: Filename is required'));
      return;
    }

    // Создание экземпляра класса TSVFileReader для чтения файла.
    const reader = new TSVFileReader(filename, new TSVParser());
    console.info(chalk.cyan(`📥 Importing: ${filename}\n`));

    try {
      // Чтение данных из файла. (из экземпляра класса TSVFileReader)
      const data = await reader.read();
      let count = 0;

      // Вывод данных в консоль. (из массива data)
      for (const item of data) {
        count++;
        console.dir(item, { colors: true, depth: 1 });
      }

      console.info(chalk.green(`\n✅ Success. Records loaded: ${count}`));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\n❌ ERROR: Can't import ${filename}`));
      console.error(chalk.gray(`   Details: ${message}`));
    }
  }
}
