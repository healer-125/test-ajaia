import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * Converts any thrown error into a consistent JSON envelope and logs it with
 * the right severity. Validation errors (arrays of messages) are preserved so
 * the client can surface field-level feedback.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(HttpExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        const r = res as Record<string, unknown>;
        message = (r.message as string | string[]) ?? exception.message;
        error = (r.error as string) ?? exception.name;
      }
      if (error === 'InternalServerError') {
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const body: ErrorBody = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        { err: exception, path: request.url },
        'Unhandled server error',
      );
    } else {
      this.logger.warn({ path: request.url, status, message }, 'Request failed');
    }

    response.status(status).json(body);
  }
}
