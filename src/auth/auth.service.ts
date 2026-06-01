import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username, fullName } = registerDto;

    try {
      // 1. Verificar si el usuario ya existe en PostgreSQL
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        if (!existingUser.isActive) {
          existingUser.isActive = true;
          existingUser.password = await bcrypt.hash(password, 10);
          if (username) existingUser.username = username;
          if (fullName) existingUser.fullName = fullName;

          await this.userRepository.save(existingUser);

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: __, ...userResponse } = existingUser;
          return {
            message: 'Tu cuenta anterior ha sido reactivada con éxito.',
            user: userResponse,
          };
        }
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
        username,
        fullName,
      });

      await this.userRepository.save(newUser);

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
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new UnauthorizedException('Credenciales no válidas.');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales no válidas.');
      }

      const payload = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = user;

      return {
        message: 'Inicio de sesión exitoso.',
        user: userResponse,
        token: this.jwtService.sign(payload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException(
        'Error interno del servidor al intentar iniciar sesión.',
      );
    }
  }

  // 🟢 READ: Obtener todos los usuarios activos
  async findAll() {
    try {
      const users = await this.userRepository.find({
        where: { isActive: true },
      });
      // eslint-disable-next-line
      return users.map(({ password: _, ...user }) => user);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error al obtener los usuarios.');
    }
  }

  // 🟢 READ: Obtener un usuario específico por ID
  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });
    if (!user) {
      throw new NotFoundException(
        `Usuario con ID ${id} no encontrado o está inactivo.`,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userResponse } = user;
    return userResponse;
  }

  // 🟢 UPDATE: Modificar el perfil de un usuario
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });
    if (!user) throw new NotFoundException(`Usuario no encontrado.`);

    const { username, fullName, password } = updateUserDto;

    try {
      // Validar duplicidad de username si se intenta cambiar
      if (username && username !== user.username) {
        const existingUsername = await this.userRepository.findOne({
          where: { username },
        });
        if (existingUsername)
          throw new ConflictException('El nombre de usuario ya está en uso.');
        user.username = username;
      }

      if (fullName) user.fullName = fullName;

      // Si cambia contraseña, aplicar hash de nuevo
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      await this.userRepository.save(user);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = user;
      return {
        message: 'Usuario actualizado exitosamente.',
        user: userResponse,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Error al actualizar el usuario.');
    }
  }

  // 🟢 DELETE: Baja lógica de un usuario (Soft Delete)
  async remove(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });
    if (!user) throw new NotFoundException(`Usuario no encontrado.`);

    // En lugar de usar remove(), cambiamos el estado a falso
    user.isActive = false;
    await this.userRepository.save(user);

    return {
      message: `El usuario con ID ${id} ha sido dado de baja correctamente.`,
    };
  }
}
