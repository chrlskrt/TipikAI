import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RequestContextMiddleware } from './common/middlewares/request-context.middleware';
import express from 'express';

const expressApp = express();
let cachedApp;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { logger: ['error', 'warn', 'log'] }
  );

  app.use(new RequestContextMiddleware().use);
  
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: true, // Allow all origins in serverless
    credentials: true,
  });

  await app.init();
  cachedApp = app;
  return app;
}

export default async (req, res) => {
  await createApp();
  return expressApp(req, res);
};
