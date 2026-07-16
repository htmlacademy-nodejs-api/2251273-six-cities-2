import { Command } from './command.interface.js';
import { TSVOfferGenerator } from '../../shared/libs/offer-generator/index.js';
import { TSVFileWriter } from '../../shared/libs/file-writer/index.js';
import got from 'got';
import chalk from 'chalk';
import { TSV_FIELDS_OFFER } from '../../shared/const.js';

export class GenerateCommand implements Command {
  getName(): string {
    return '--generate';
  }

  async execute(...args: string[]): Promise<void> {
    const [countStr, filePath, url] = args;
    const count = parseInt(countStr, 10);

    if (!count || !filePath || !url) {
      return console.error(chalk.red('❌ Usage: --generate <count> <filepath> <url>'));
    }

    try {
      const mockData = JSON.parse((await got(url)).body);
      const writer = new TSVFileWriter(filePath);

      await writer.write(TSV_FIELDS_OFFER.join('\t'));

      const generator = new TSVOfferGenerator(mockData);
      for (let i = 0; i < count; i++) {
        await writer.write(generator.generate());
      }

      await writer.close();
      console.info(chalk.green(`✅ Generated ${count} offers to ${filePath}`));

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`❌ ERROR: ${msg}`));
    }
  }
}
