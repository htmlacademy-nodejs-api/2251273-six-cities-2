import pino from 'pino';
import { resolve } from 'node:path';

export const logger = pino({
  transport: {
    targets: [
      // Красивый вывод в консоль (stderr, чтобы не мешать stdout)
      {
        target: 'pino-pretty',
        options: { colorize: true, destination: 2 }, // 2 = stderr
      },
      // Запись всех логов в файл
      {
        target: 'pino/file',
        options: { destination: resolve('./logs/cli-app.log') },
      }
    ]
  }
});
