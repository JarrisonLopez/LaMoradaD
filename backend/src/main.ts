// LaMorada/backend/src/main.ts

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { raw } from 'body-parser'; // 👈 necesario para Stripe



async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === Webhook Stripe: raw body en esta ruta ===
  // Debe ir ANTES de que Nest procese requests en esa ruta
  app.use('/api/payments/webhook', raw({ type: '*/*' }));

  // === Asegurar carpetas de subida ===
  const uploadsRoot = join(process.cwd(), 'uploads');
  const podcastsDir = join(uploadsRoot, 'podcasts');
  if (!existsSync(uploadsRoot)) mkdirSync(uploadsRoot);
  if (!existsSync(podcastsDir)) mkdirSync(podcastsDir, { recursive: true });

  // Servir archivos subidos (p.ej. /uploads/podcasts/*.mp3)
  app.use('/uploads', express.static(uploadsRoot));

  // Prefix global
  app.setGlobalPrefix('api');

  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS
  const cfg = app.get(ConfigService);
  const origin = cfg.get<string>('CORS_ORIGIN') ?? 'http://localhost:4200';
  app.enableCors({ origin, credentials: true });

  // Swagger con JWT Bearer
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LaMorada API')
    .setDescription('Backend NestJS + TypeORM + PostgreSQL')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwt',
    )
    .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'x-user-id')
    .addApiKey({ type: 'apiKey', name: 'x-user-role', in: 'header' }, 'x-user-role')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}
bootstrap();
