export const TYPES = {
  // Общие зависимости)
  Logger: Symbol.for('Logger'),
  Config: Symbol.for('Config'),
  // REST
  Application: Symbol.for('Application'),
  // База данных
  DatabaseClient: Symbol.for('DatabaseClient'),
  // Репозитории
  UserRepository: Symbol.for('UserRepository'),
  OfferRepository: Symbol.for('OfferRepository'),
  CommentRepository: Symbol.for('CommentRepository'),
  AuthRepository: Symbol.for('AuthRepository'),
  // CLI
  CLIApplication: Symbol.for('CLIApplication'),
  HelpCommand: Symbol.for('HelpCommand'),
  VersionCommand: Symbol.for('VersionCommand'),
  ImportCommand: Symbol.for('ImportCommand'),
  GenerateCommand: Symbol.for('GenerateCommand'),
  // Сервисы
  UserService: Symbol.for('UserService'),
  CommentService: Symbol.for('CommentService'),
  OfferService: Symbol.for('OfferService'),
  AuthService: Symbol.for('AuthService'),
  // Контроллеры
  UserController: Symbol.for('UserController'),
  AuthController: Symbol.for('AuthController'),
  OfferController: Symbol.for('OfferController'),
  CommentController: Symbol.for('CommentController'),
  // Middleware
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  OfferOwnerMiddleware: Symbol.for('OfferOwnerMiddleware'),
  // Фильтры
  ExceptionFilter: Symbol.for('ExceptionFilter'),
};
