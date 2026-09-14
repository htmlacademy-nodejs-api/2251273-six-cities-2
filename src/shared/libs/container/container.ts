import { Container } from 'inversify';
import { TYPES } from './container.types.js';
import { PinoLogger, LoggerInterface } from './../logger/index.js';
import { RestConfig } from './../config/index.js';
import { RestApplication } from './../../../rest/index.js';
import { DatabaseClientInterface, MongoClient } from './../database/index.js';
import { DefaultUserRepository, UserRepository } from './../../modules/user/index.js';
import { DefaultOfferRepository, OfferRepository } from './../../modules/offer/index.js';
import {
  HelpCommand,
  VersionCommand,
  ImportCommand,
  GenerateCommand,
} from './../../../cli/commands/index.js';
import { CliApplication } from '../../../cli/index.js';
import {
  CommentController,
  CommentRepository,
  CommentService,
  DefaultCommentRepository,
  DefaultCommentService,
} from '../../modules/comment/index.js';
import { UserService } from '../../modules/user/user.service.js';
import { DefaultOfferService, OfferService } from '../../modules/offer/offer.service.js';
import { AuthService } from '../../modules/auth/auth.service.js';
import { AuthController } from '../../modules/auth/auth.controller.js';
import { UserController } from '../../modules/user/user.controller.js';
import { AuthMiddleware, AuthRepository, DefaultAuthRepository } from '../../modules/auth/index.js';
import { OfferController } from '../../modules/offer/offer.controller.js';
import { ExceptionFilter } from '../exception-filter/index.js';
import { OfferOwnerMiddleware } from '../middleware/offer-owner.middleware.js';

const container = new Container();
// Общие зависимости
container.bind<LoggerInterface>(TYPES.Logger).to(PinoLogger).inSingletonScope();
container.bind<RestConfig>(TYPES.Config).to(RestConfig).inSingletonScope();
// REST
container.bind<RestApplication>(TYPES.Application).to(RestApplication);
// База данных
container.bind<DatabaseClientInterface>(TYPES.DatabaseClient).to(MongoClient).inSingletonScope();
// Репозитории
container.bind<UserRepository>(TYPES.UserRepository).to(DefaultUserRepository);
container.bind<OfferRepository>(TYPES.OfferRepository).to(DefaultOfferRepository);
container.bind<CommentRepository>(TYPES.CommentRepository).to(DefaultCommentRepository);
container.bind<AuthRepository>(TYPES.AuthRepository).to(DefaultAuthRepository);
// CLI
container.bind<CliApplication>(TYPES.CLIApplication).to(CliApplication);
container.bind<HelpCommand>(TYPES.HelpCommand).to(HelpCommand);
container.bind<VersionCommand>(TYPES.VersionCommand).to(VersionCommand);
container.bind<ImportCommand>(TYPES.ImportCommand).to(ImportCommand);
container.bind<GenerateCommand>(TYPES.GenerateCommand).to(GenerateCommand);
// Сервисы
container.bind<CommentService>(TYPES.CommentService).to(DefaultCommentService).inSingletonScope();
container.bind<OfferService>(TYPES.OfferService).to(DefaultOfferService).inSingletonScope();
container.bind<UserService>(TYPES.UserService).to(UserService).inSingletonScope();
container.bind<AuthService>(TYPES.AuthService).to(AuthService);
// Контроллеры
container.bind<AuthController>(TYPES.AuthController).to(AuthController).inSingletonScope();
container.bind<OfferController>(TYPES.OfferController).to(OfferController).inSingletonScope();
container.bind<UserController>(TYPES.UserController).to(UserController).inSingletonScope();
container.bind<CommentController>(TYPES.CommentController).to(CommentController).inSingletonScope();
// Middleware
container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware).inSingletonScope();
container.bind<OfferOwnerMiddleware>(TYPES.OfferOwnerMiddleware).to(OfferOwnerMiddleware).inSingletonScope();
// Filters
container.bind<ExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter).inSingletonScope();

export { container };
