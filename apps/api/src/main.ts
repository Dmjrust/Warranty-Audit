import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}`);
}

bootstrap();
