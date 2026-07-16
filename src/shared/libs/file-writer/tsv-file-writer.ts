import { createWriteStream, WriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { FileWriter } from './file-writer.interface.js';

export class TSVFileWriter implements FileWriter {
  private readonly stream: WriteStream;

  constructor(filename: string) {
    this.stream = createWriteStream(filename, { encoding: 'utf8' });
  }

  public async write(row: string): Promise<void> {
    if (!this.stream.write(`${row}\n`)) {
      await new Promise<void>((resolve) => this.stream.once('drain', resolve));
    }
  }

  public async close(): Promise<void> {
    this.stream.end();
    await finished(this.stream);
  }
}
