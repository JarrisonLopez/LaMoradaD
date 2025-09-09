import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  // Prefix global (mantén /api para que el front pegue a /api/...)
  app.setGlobalPrefix('api');

  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // habilita transformación (DTOs)
      forbidNonWhitelisted: false, // opcionalmente más estricto
    }),
  );

  // CORS (útil en dev si no usas proxy de Angular)
  const cfg = app.get(ConfigService);
  const origin = cfg.get<string>('CORS_ORIGIN') ?? 'http://localhost:4200';
  app.enableCors({ origin, credentials: true });

  // Swagger con JWT Bearer (y dejamos los x-user-* como legacy opcional)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LaMorada API')
    .setDescription('Backend NestJS + TypeORM + PostgreSQL')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwt',
    )
    // Opcional: mantener headers mock para pruebas manuales
    .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'x-user-id')
    .addApiKey({ type: 'apiKey', name: 'x-user-role', in: 'header' }, 'x-user-role')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // console.log(`API on http://localhost:${port}/api  |  Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
