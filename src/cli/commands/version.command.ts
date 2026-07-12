import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from './command.interface.js';
import chalk from 'chalk';

type PackageJSONConfig = {
  version: string;
};

function isPackageJSONConfig(value: unknown): value is PackageJSONConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'version' in value &&
    typeof (value as PackageJSONConfig).version === 'string'
  );
}

export class VersionCommand implements Command {
  constructor(
    private readonly filePath: string = './package.json',
  ) {}

  private readVersion(): string {
    const absolutePath = resolve(this.filePath);
    const fileContent = readFileSync(absolutePath, 'utf-8');
    const importedContent: unknown = JSON.parse(fileContent);

    if (!isPackageJSONConfig(importedContent)) {
      throw new Error('Failed to parse json content.');
    }

    return importedContent.version;
  }

  getName(): string {
    return '--version';
  }

  execute(): void {
    try {
      const version = this.readVersion();

      console.info(
        chalk.cyan('📦 Version:'),
        chalk.bold.green(version),
      );
      console.info(
        chalk.gray(`   from ${chalk.underline(this.filePath)}`),
      );
    } catch (error: unknown) {
      console.error(
        chalk.bgRed.white.bold(' ❌ ERROR '),
        chalk.red('Failed to read version from'),
        chalk.underline.yellow(this.filePath),
      );

      if (error instanceof Error) {
        console.error(
          chalk.red('   Details:'),
          chalk.gray(error.message),
        );
      }

      console.error(
        chalk.yellow('💡 Hint:'),
        chalk.gray('Make sure you are running the command from the project root directory.'),
      );
    }
  }
}
