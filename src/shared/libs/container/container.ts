import { Container } from 'inversify';
import { TYPES } from './container.types.js';
import { PinoLogger, LoggerInterface } from './../logger/logger.index.js';
import { RestConfig } from './../config/config.index.js';
import { RestApplication } from './../../../rest/index.js';

const container = new Container();

container
  .bind<LoggerInterface>(TYPES.Logger)// Ключ, по которому будем искать
  .to(PinoLogger)// Какой класс создавать
  .inSingletonScope();// Стратегия: один на всё приложение

container
  .bind<RestConfig>(TYPES.Config)
  .to(RestConfig)
  .inSingletonScope();

container
  .bind<RestApplication>(TYPES.Application)
  .to(RestApplication);

export { container };
