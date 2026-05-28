import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    try {
      // 1. Verificar si el usuario ya existe en PostgreSQL
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException(
          'El correo electrónico ya se encuentra registrado.',
        );
      }

      // 2. Encriptar la contraseña (10 rondas de salting es el estándar de seguridad)
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Crear la instancia de la entidad y guardarla
      const newUser = this.userRepository.create({
        email,
        password: hashedPassword,
      });

      await this.userRepository.save(newUser);

      // 4. Retornar el usuario creado eliminando la contraseña de la respuesta por seguridad
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = newUser;
      return {
        message: 'Usuario registrado exitosamente.',
        user: userResponse,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      // Captura fallos inesperados de la base de datos
      throw new InternalServerErrorException(
        'Error interno del servidor al crear el usuario.',
      );
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // 1. Buscar al usuario en la base de datos por su correo electrónico
      const user = await this.userRepository.findOne({ where: { email } });

      // 2. Si no existe, lanzamos un error 401 (No autorizado)
      // 💡 BUENA PRÁCTICA: Usar un mensaje genérico ("Credenciales no válidas")
      // para no revelar si el correo existe o no en el sistema.
      if (!user) {
        throw new UnauthorizedException('Credenciales no válidas.');
      }

      // 3. Comparar la contraseña ingresada con el hash guardado en Postgres
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales no válidas.');
      }

      // 4. Si las credenciales son correctas, preparamos la respuesta segura
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = user;

      return {
        message: 'Inicio de sesión exitoso.',
        user: userResponse,
        // TODO: En la Semana 3 inyectaremos el JwtService aquí para generar el token
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException(
        'Error interno del servidor al intentar iniciar sesión.',
      );
    }
  }
}
