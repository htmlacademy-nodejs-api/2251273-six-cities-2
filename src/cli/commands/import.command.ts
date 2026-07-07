import { Command } from './command.interface.js';

export class ImportCommand implements Command {
  public getName(): string {
    return '--import';
  }

  public execute(...args: string[]): void {
    // Чтение файла
  }
}
