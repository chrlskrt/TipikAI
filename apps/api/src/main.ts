import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestContextMiddleware } from './common/middlewares/request-context.middleware';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(new RequestContextMiddleware().use);
  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:8000', 'http://localhost:3001'], // Allow your Next.js frontend
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('TipikAI API Documentation')
    .setDescription('This contains all the API documentation for TipikAI.')
    .addServer('http://localhost:8000', 'Development server')
    .setVersion('1.0')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name must match the one used in @ApiBearerAuth() decorators
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI available at /api-docs
  SwaggerModule.setup('api-docs', app, document,{swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    }});

  // Raw Swagger JSON available at /docs-json
  app.getHttpAdapter().get('/docs-json', (req, res) => {
    res.json(document);
  });

  await app.listen(process.env.PORT ?? 8000);
}

bootstrap();
