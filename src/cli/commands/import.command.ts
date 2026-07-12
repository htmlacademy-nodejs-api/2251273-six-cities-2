import { Command } from './command.interface.js';
import { TSVFileReader } from '../../shared/libs/file-reader/index.js';
import chalk from 'chalk';

function printDataAsCards(data: Array<Record<string, unknown>>): void {
  data.forEach((item, index) => {
    console.info(chalk.bold.blue(`\n  #${index + 1}`));

    Object.entries(item).forEach(([key, value]) => {
      const formattedKey = chalk.cyan(`  ${key.padEnd(15)}`);
      let formattedValue: string = chalk.green(String(value));

      if (typeof value === 'number') {
        formattedValue = chalk.yellow(String(value));
      }
      if (typeof value === 'boolean') {
        formattedValue = chalk.magenta(String(value));
      }
      if (value === null || value === undefined) {
        formattedValue = chalk.gray('null');
      }

      console.log(`${formattedKey}${chalk.gray(':')} ${formattedValue}`);
    });

    console.log(chalk.gray(`  ${'─'.repeat(40)}`));
  });
}

export class ImportCommand implements Command {
  public getName(): string {
    return '--import';
  }

  public execute(...parameters: string[]): void {
    const [filename] = parameters;
    const fileReader = new TSVFileReader(filename.trim());

    console.info(
      chalk.cyan('📥 Importing data from file:'),
      chalk.underline.yellow(filename),
    );

    try {
      fileReader.read();
      const data = fileReader.toArray();

      console.info(chalk.green('✅ Import completed successfully.'));
      console.info(chalk.gray(`   Records loaded: ${chalk.bold.white(data.length)}`));

      console.info(chalk.cyan('\n📋 Imported data:'));
      printDataAsCards(data);
    } catch (err) {
      if (!(err instanceof Error)) {
        throw err;
      }

      console.error(
        chalk.bgRed.white.bold(' ❌ ERROR '),
        chalk.red('Can\'t import data from file:'),
        chalk.underline.red(filename),
      );

      console.error(
        chalk.red('   Details:'),
        chalk.gray(err.message),
      );

      console.error(
        chalk.yellow('💡 Hint:'),
        chalk.gray('Check that the file exists and the path is correct.'),
      );
    }
  }
}
