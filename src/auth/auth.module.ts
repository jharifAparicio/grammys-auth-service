import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';

@Module({
  imports: [
    // Registra el repositorio de TypeORM para la entidad User en este módulo
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController, UserController],
  providers: [AuthService],
})
export class AuthModule {}
