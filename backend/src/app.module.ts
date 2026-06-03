import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LoggerModule } from 'nestjs-pino';
import configuration, { AppConfig } from './config/configuration';
import { buildTypeOrmOptions } from './database/typeorm.config';
import { buildLoggerParams } from './common/logger.config';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { SharesModule } from './shares/shares.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildLoggerParams,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    // Serve the built SPA only when a build directory is configured (prod/Docker).
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dist = config.get<AppConfig>('app')!.frontendDist;
        if (!dist) {
          return [];
        }
        return [
          {
            rootPath: dist,
            exclude: ['/api/{*path}'],
          },
        ];
      },
    }),
    AuthModule,
    UsersModule,
    DocumentsModule,
    SharesModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
