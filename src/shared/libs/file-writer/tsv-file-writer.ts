import { createWriteStream, WriteStream } from 'node:fs';
import { once } from 'node:events';

export class TSVFileWriter {
  private readonly stream: WriteStream;

  constructor(filePath: string) {
    this.stream = createWriteStream(filePath, { encoding: 'utf-8' });
  }

  public async write(line: string): Promise<void> {
    const ok = this.stream.write(`${line}\n`);
    if (!ok) {
      await once(this.stream, 'drain');
    }
  }

  public async close(): Promise<void> {
    this.stream.end();
    await once(this.stream, 'finish');
  }
}
