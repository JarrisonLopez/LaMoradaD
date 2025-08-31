import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Post() create(@Body() dto: CreateRoleDto) { return this.service.create(dto); }
  @Get()  findAll() { return this.service.findAll(); }
}
