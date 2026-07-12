export interface Command {
  getName(): string;
  execute(...args: string[]): void;
}
