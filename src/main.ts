import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo obligatorio para el enrutamiento del Proxy de NGINX
  app.setGlobalPrefix('api/auth');

  // Habilitar tuberías de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
  console.log(`[AUTH-SERVICE] Inicializado internamente en el puerto 3000`);
}

bootstrap();
