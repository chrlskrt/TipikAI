const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

let app;

async function bootstrap() {
  if (!app) {
    try {
      // Use require for compiled JS modules
      const { AppModule } = require('../dist/app.module');
      const { RequestContextMiddleware } = require('../dist/common/middlewares/request-context.middleware');
      
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
    } catch (error) {
      console.error('Bootstrap error:', error);
      throw error;
    }
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    const server = await bootstrap();
    const instance = server.getHttpAdapter().getInstance();
    return instance(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      details: error.stack
    });
  }
};
