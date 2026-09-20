export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }

  public static unauthorized(message: string): HttpError {
    return new HttpError(401, message);
  }

  public static forbidden(message: string): HttpError {
    return new HttpError(403, message);
  }

  public static notFound(message: string): HttpError {
    return new HttpError(404, message);
  }

  public static badRequest(message: string): HttpError {
    return new HttpError(400, message);
  }

  public static conflict(message: string): HttpError {
    return new HttpError(409, message);
  }
}
