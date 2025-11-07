import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connectDB } from './config/database';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  await connectDB();

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const apiVersion = configService.get<string>('API_VERSION') || 'v1.0';

  app.setGlobalPrefix(`api/${apiVersion}`);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(
    `Application is running on: http://localhost:${port}/api/${apiVersion}`,
  );
}

bootstrap();
