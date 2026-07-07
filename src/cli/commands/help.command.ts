import { Command } from './command.interface.js';
import chalk from 'chalk';

export class HelpCommand implements Command {
  public getName(): string {
    return '--help';
  }

  public execute(..._args: string[]): void {
    console.info(this.getHelpText());
  }

  private getHelpText(): string {
    return `
${chalk.bold('CLI-утилита для подготовки данных REST API сервера')}

${chalk.underline('Использование:')} cli.js ${chalk.cyan('<command>')} ${chalk.yellow('[arguments]')}

${chalk.underline('Команды:')}
  ${chalk.cyan('--version')}------------------------ ${chalk.magenta('вывод номера версии')}
  ${chalk.cyan('--help')}--------------------------- ${chalk.magenta('вывод эта справка')}
  ${chalk.cyan('--import')} ${chalk.yellow('<path>')}------------------ ${chalk.magenta('импорт из TSV')}
  ${chalk.cyan('--generate')} ${chalk.yellow('<n> <path> <url>')}------ ${chalk.magenta('генерация тестовых данных')}

${chalk.underline('Примеры:')}
  ${chalk.green('cli.js --version')}
  ${chalk.green('cli.js --import ./data/offers.tsv')}
  ${chalk.green('cli.js --generate 50 ./data/test.tsv http://example.com/images')}
`.trim();
  }
}
