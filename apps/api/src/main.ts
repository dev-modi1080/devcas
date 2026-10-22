import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { join } from 'path';
import * as express from 'express';
import * as fs from 'fs';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Ensure uploads directory exists
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const uploadDir =
    process.env.UPLOAD_DIR ||
    (isServerless ? join(os.tmpdir(), 'uploads') : './uploads');
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (err) {
    console.warn(`Could not create upload directory ${uploadDir}:`, err);
  }
  app.use('/uploads', express.static(uploadDir));

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('CAS Digital Platform API')
    .setDescription('Corporate Agri Sustainability Platform API - Adani Enterprises Ltd')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`CAS Digital Platform API running on http://localhost:${port}/api/v1`);
  console.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
