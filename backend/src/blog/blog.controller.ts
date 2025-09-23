// src/blog/blog.controller.ts
import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles as AllowRoles } from '../common/auth/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger'; // 👈 importa ApiQuery

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly service: BlogService) {}

  // 👇 aquí agregamos los ApiQuery
  @Get()
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async list(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    return this.service.list({
      q, category,
      page: Number(page) || 1,
      pageSize: Math.min(Number(pageSize) || 10, 50),
    });
  }

  @Get('slug/:slug')
  async bySlug(@Param('slug') slug: string) {
    return this.service.bySlug(slug);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('psicologo', 'admin')
  async create(@Body() dto: CreatePostDto, @Req() req: any) {
    return this.service.create(Number(req.user?.sub), dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('psicologo', 'admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto, @Req() req: any) {
    return this.service.update(Number(req.user?.sub), id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('psicologo', 'admin')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.remove(id, Number(req.user?.sub));
  }
}
