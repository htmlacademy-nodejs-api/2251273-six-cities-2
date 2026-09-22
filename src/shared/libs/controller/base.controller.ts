import { Response, Router, Request, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { injectable } from 'inversify';
import { LoggerInterface } from '../logger/logger.interface.js';
import { MiddlewareInterface } from '../middleware/middleware.interface.js';
import { HttpMethod } from './http-method.enum.js';

type RouteParams = Record<string, string | string[]>;

type RouteHandler<P extends RouteParams = RouteParams> = (
  req: Request<P>,
  res: Response,
) => Promise<void> | void;

@injectable()
export abstract class BaseController {
  protected readonly logger: LoggerInterface;
  protected readonly router: Router;

  constructor(logger: LoggerInterface) {
    this.logger = logger;
    this.router = Router();
  }

  public getRouter(): Router {
    return this.router;
  }

  protected addRoute<P extends RouteParams = RouteParams>(
    method: HttpMethod,
    path: string,
    handler: RouteHandler<P>,
    middlewares: MiddlewareInterface[] = [],
  ): void {
    const middlewareHandlers: RequestHandler[] = middlewares.map((m) =>
      m.execute.bind(m) as unknown as RequestHandler,
    );

    const wrappedHandler: RequestHandler = handler.bind(this) as unknown as RequestHandler;
    const chain: RequestHandler[] = [...middlewareHandlers, wrappedHandler];

    switch (method) {
      case HttpMethod.Get:
        this.router.get(path, ...chain);
        break;
      case HttpMethod.Post:
        this.router.post(path, ...chain);
        break;
      case HttpMethod.Delete:
        this.router.delete(path, ...chain);
        break;
      case HttpMethod.Patch:
        this.router.patch(path, ...chain);
        break;
      case HttpMethod.Put:
        this.router.put(path, ...chain);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    this.logger.info(`BaseController: Registered ${method.toUpperCase()} ${path}`);
  }

  public ok<T>(res: Response, data: T): void {
    res.status(StatusCodes.OK).json(data);
  }

  public created<T>(res: Response, data: T): void {
    res.status(StatusCodes.CREATED).json(data);
  }

  public noContent(res: Response): void {
    res.status(StatusCodes.NO_CONTENT).send();
  }

  public badRequest(res: Response, message: string): void {
    res.status(StatusCodes.BAD_REQUEST).json({ message });
  }

  public unauthorized(res: Response, message: string): void {
    res.status(StatusCodes.UNAUTHORIZED).json({ message });
  }

  public forbidden(res: Response, message: string): void {
    res.status(StatusCodes.FORBIDDEN).json({ message });
  }

  public notFound(res: Response, message: string): void {
    res.status(StatusCodes.NOT_FOUND).json({ message });
  }

  public conflict(res: Response, message: string): void {
    res.status(StatusCodes.CONFLICT).json({ message });
  }

  public internalServerError(res: Response, message: string): void {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message });
  }
}
