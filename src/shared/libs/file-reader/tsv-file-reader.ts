import * as fs from 'node:fs';
import * as readline from 'node:readline';
import { TSVParser } from './../tsv-parser/index.js';
import { OffersItemType } from '../../types/index.type.js';

export class TSVFileReader {
  // Получаем файл (путь к нему) и парсер
  constructor(
    private readonly filename: string,
    private readonly parser: TSVParser
  ) {}

  // Читаем файл
  public async read(): Promise<OffersItemType[]> {
    // Создаем интерфейс для чтения
    const rl = readline.createInterface({
      input: fs.createReadStream(this.filename, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    // Создаем пустой массив
    const results: OffersItemType[] = [];
    let isFirstLine = true;

    // Проходимся по каждой строке
    for await (const line of rl) {
      console.log(line);
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }
      if (line.trim()) {
        // Парсим строку
        results.push(this.parser.parse(line));
      }
    }

    return results;
  }
}
