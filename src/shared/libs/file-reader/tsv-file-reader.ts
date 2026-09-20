import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { LoggerInterface } from '../logger/logger.interface.js';
import { TSVParser } from '../tsv-parser/index.js';
import { OffersItemType } from '../../types/index.type.js';

export class TSVFileReader {
  constructor(
    private readonly filename: string,
    private readonly parser: TSVParser,
    private readonly logger: LoggerInterface,
  ) {}

  public async read(): Promise<OffersItemType[]> {
    const result: OffersItemType[] = [];

    const readStream = createReadStream(this.filename, { encoding: 'utf-8' });
    const rl = createInterface({ input: readStream, crlfDelay: Infinity });

    let lineNumber = 0;
    for await (const line of rl) {
      lineNumber += 1;
      if (lineNumber === 1 && line.startsWith('title\t')) {
        continue;
      }
      if (line.trim() === '') {
        continue;
      }
      try {
        result.push(this.parser.parse(line) as OffersItemType);
      } catch (error) {
        this.logger.warn(`TSVFileReader: Skipped line #${lineNumber}`);
      }
    }

    return result;
  }
}
