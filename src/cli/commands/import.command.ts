import { Command } from './command.interface.js';
import { TSVFileReader } from '../../shared/libs/file-reader/index.js';
import { TSVParser } from '../../shared/libs/tsv-parser/tsv-parser.js';
import chalk from 'chalk';

export class ImportCommand implements Command {
  public getName(): string {
    return '--import';
  }

  public async execute(...parameters: string[]): Promise<void> {
    const filename = parameters[0]?.trim();

    if (!filename) {
      console.error(chalk.red('❌ ERROR: Filename is required'));
      return;
    }

    const reader = new TSVFileReader(filename, new TSVParser());
    console.info(chalk.cyan(`📥 Importing: ${filename}\n`));

    try {
      const data = await reader.read();
      let count = 0;

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
