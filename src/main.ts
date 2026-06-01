import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Grammys - Auth & User Service')
    .setDescription(
      'Microservicio encargado de la autenticación, seguridad y gestión de perfiles de usuario.',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Endpoints públicos para el registro e inicio de sesión')
    .addTag('User', 'Endpoints protegidos para la gestión del CRUD de usuarios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[AUTH-SERVICE] Servidor corriendo en http://localhost:${port}`);
  console.log(
    `[AUTH-SERVICE] Documentación de Swagger disponible en http://localhost:${port}/api/docs`,
  );
}

bootstrap().catch((err) => {
  console.error('[AUTH-SERVICE] Error during bootstrap:', err);
});
