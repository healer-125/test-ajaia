import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Route Nest's internal logs through pino.
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const appConfig = config.get<AppConfig>('app')!;

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(appConfig.port, '0.0.0.0');
  app
    .get(Logger)
    .log(`API listening on http://localhost:${appConfig.port}`, 'Bootstrap');
}

void bootstrap();
