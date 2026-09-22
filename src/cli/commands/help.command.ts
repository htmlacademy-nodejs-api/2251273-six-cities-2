import { inject, injectable } from 'inversify';
import { Command } from './command.interface.js';
import { TYPES } from '../../shared/libs/container/index.js';
import { LoggerInterface } from '../../shared/libs/logger/index.js';

@injectable()
export class HelpCommand implements Command {
  constructor(
    @inject(TYPES.Logger) private readonly logger: LoggerInterface
  ) { }

  public getName(): string {
    return '--help';
  }

  public async execute(..._args: string[]): Promise<void> {
    this.logger.info('HelpCommand: Displaying help...');
    this.logger.info(this.getHelpText());
  }

  private getHelpText(): string {
    return `
Программа для подготовки данных для REST API сервера.

Пример: cli.js --<command> [--arguments]

Команды:

  --version                       # выводит номер версии
  --help                          # печатает этот текст
  --import <path>                 # импортирует данные из TSV
  --generate <n> <path> <url>     # генерирует произвольное количество тестовых данных
`.trim();
  }
}
