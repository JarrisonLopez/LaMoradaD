import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles as AllowRoles } from '../common/auth/roles.decorator';
import { Roles } from '../common/auth/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  /** Registro público: SIEMPRE crea usuario normal */
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    const clean = { ...dto };
    delete (clean as any).roleId;
    return this.service.createAsUsuario(clean);
  }

  /** Perfil del usuario autenticado */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const id = req.user?.sub;
    const db = id ? await this.service.findOne(id) : null;
    return {
      id,
      name: db?.name ?? req.user?.name ?? null,
      role: (db?.role as any)?.name ?? req.user?.role ?? null,
    };
  }

  /** Lista "lite" de pacientes */
  @Get('patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('psicologo', 'admin')
  async listPatientsLite() {
    return this.service.findPatientsLite();
  }

  /** Lista "lite" de profesionales */
  @Get('professionals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('usuario', 'admin')
  async listProfessionalsLite() {
    return this.service.findProfessionalsLite();
  }

  /** HU-34: Lista completa de profesionales (pública) */
  @Get('professionals/full')
  async listProfessionals() {
    return this.service.listProfessionals();
  }

  /** HU-34: Perfil completo de un profesional (público) */
  @Get('professionals/:id/profile')
  async getProfessionalProfile(@Param('id') id: string) {
    return this.service.getProfessionalProfile(id);
  }

  /** Profesional autenticado: crear/editar su propio perfil */
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  async updateMyProfile(@Req() req: any, @Body() dto: UpdateProfessionalProfileDto) {
    return this.service.updateMyProfessionalProfile(req.user.sub, dto);
  }

  /** ===================== ADMIN ===================== */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('admin')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('admin')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('admin')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
