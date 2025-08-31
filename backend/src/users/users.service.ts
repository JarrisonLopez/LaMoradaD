import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Role) private roles: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email ya registrado');

    const u = this.users.create({
      name: dto.name,
      email: dto.email,
      password: await bcrypt.hash(dto.password, 10),
    });

    if (dto.roleId) {
      const role = await this.roles.findOne({ where: { id: dto.roleId } });
      if (!role) throw new BadRequestException('Rol no existe');
      u.role = role;
    }
    const saved = await this.users.save(u);
    // no devolver password
    delete (saved as any).password;
    return saved;
  }

  findAll() {
    return this.users.find();
  }
}
