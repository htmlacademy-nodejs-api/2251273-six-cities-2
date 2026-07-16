import { createWriteStream, WriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { FileWriter } from './file-writer.interface.js';

export class TSVFileWriter implements FileWriter {
  // Создаем экземпляр класса WriteStream
  private readonly stream: WriteStream;

  constructor(filename: string) {
    // Создаем стрим для записи
    this.stream = createWriteStream(filename, { encoding: 'utf8' });
  }

  // Записываем строку
  public async write(row: string): Promise<void> {
    // Записываем строку в стрим
    if (!this.stream.write(`${row}\n`)) {
      // Ждем пока стрим освободится
      await new Promise<void>((resolve) => this.stream.once('drain', resolve));
    }
  }

  // Закрываем файл
  public async close(): Promise<void> {
    this.stream.end();
    await finished(this.stream);
  }
}
