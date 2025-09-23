import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { ProfessionalProfile } from '../entities/professional-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, ProfessionalProfile]), // 👈 añade el repo del perfil
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // opcional: útil si otros módulos necesitan el servicio
})
export class UsersModule {}
