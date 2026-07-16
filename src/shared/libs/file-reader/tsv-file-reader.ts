import * as fs from 'node:fs';
import * as readline from 'node:readline';
import { TSVParser } from './../tsv-parser/tsv-parser.js';

export class TSVFileReader {
  constructor(
    private readonly filename: string,
    private readonly parser: TSVParser
  ) {}

  public async read(): Promise<unknown[]> {
    const rl = readline.createInterface({
      input: fs.createReadStream(this.filename, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    const results: unknown[] = [];
    let isFirstLine = true;

    for await (const line of rl) {
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }
      if (line.trim()) {
        results.push(this.parser.parse(line));
      }
    }

    return results;
  }
}
