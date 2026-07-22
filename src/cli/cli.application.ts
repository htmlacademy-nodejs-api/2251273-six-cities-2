import { Command } from './commands/command.interface.js';
import { CommandParser } from './command.parser.js';

type CommandCollection = Record<string, Command>;

export class CLIApplication {
  private commands: CommandCollection = {};

  constructor(
    private readonly defaultCommand: string = '--help',
  ) {}

  public registerCommands(commandList: Command[]): void {
    commandList.forEach((command) => {
      const name = command.getName();

      if (Object.prototype.hasOwnProperty.call(this.commands, name)) {
        throw new Error(`Command ${name} is already registered`);
      }

      this.commands[name] = command;
    });
  }

  public getCommand(commandName: string): Command {
    if (!commandName || !this.commands[commandName]) {
      return this.getDefaultCommand();
    }
    return this.commands[commandName];
  }

  public getDefaultCommand(): Command {
    const command = this.commands[this.defaultCommand];

    if (!command) {
      throw new Error(
        `The default command (${this.defaultCommand}) is not registered.`,
      );
    }

    return command;
  }

  public processCommand(argv: string[]): void {
    const parsedCommand = CommandParser.parse(argv);
    const commandNames = Object.keys(parsedCommand);

    const commandName = commandNames[0] ?? '';
    const command = this.getCommand(commandName);
    const commandArguments = parsedCommand[commandName] ?? [];

    try {
      command.execute(...commandArguments);
    } catch (error: unknown) {
      console.error(`Error executing command "${command.getName()}":`);

      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }
}
