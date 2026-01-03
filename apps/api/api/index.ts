import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { RequestContextMiddleware } from '../src/common/middlewares/request-context.middleware';

let app;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });

    app.use(new RequestContextMiddleware().use);
    
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.enableCors({
      origin: true,
      credentials: true,
    });

    await app.init();
  }
  return app;
}

export default async (req, res) => {
  try {
    const server = await bootstrap();
    const instance = server.getHttpAdapter().getInstance();
    return instance(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
