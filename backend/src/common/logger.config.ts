import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { AppConfig } from '../config/configuration';

/**
 * Builds the nestjs-pino configuration. In development we use pino-pretty for
 * readable single-line logs; in production we emit structured JSON. Sensitive
 * headers are always redacted.
 */
export function buildLoggerParams(config: ConfigService): Params {
  const app = config.get<AppConfig>('app')!;
  const isProd = app.nodeEnv === 'production';

  return {
    pinoHttp: {
      level: isProd ? 'info' : 'debug',
      transport: isProd
        ? undefined
        : {
            target: 'pino-pretty',
            options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
          },
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        remove: true,
      },
      // Quieten health/static noise; still log API calls.
      autoLogging: {
        ignore: (req) => req.url === '/api/health',
      },
      customProps: () => ({ context: 'HTTP' }),
    },
  };
}
