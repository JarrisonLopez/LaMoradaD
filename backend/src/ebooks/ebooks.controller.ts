import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EbooksService } from './ebooks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

const storage = diskStorage({
  destination: './uploads/ebooks',
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: (e: any, ok: boolean) => void) => {
  // PDF, ePub, MOBI
  const allowed = ['application/pdf', 'application/epub+zip', 'application/x-mobipocket-ebook'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de archivo no permitido (usa PDF/ePub/MOBI)'), false);
};

const limits = { fileSize: 10 * 1024 * 1024 }; // 10 MB

@Controller('ebooks')
export class EbooksController {
  constructor(private readonly service: EbooksService) {}

  // Crear (psicólogo o admin) – soporta archivo o sólo campos
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'psicologo')
  @UseInterceptors(FileInterceptor('file', { storage, fileFilter, limits }))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateEbookDto,
    @Req() req: any,
  ) {
    if (file) {
      // Guarda path relativo; ya servimos /uploads en main.ts
      dto.fileUrl = `/uploads/ebooks/${file.filename}`;
    }
    return this.service.create(req.user.sub, dto);
  }

  // Tus ebooks (psicólogo o admin)
  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'psicologo')
  listMine(@Req() req: any) {
    return this.service.listByAuthor(req.user.sub);
  }

  // Lista pública
  @Get()
  listAll() {
    return this.service.listAll();
  }

  // Por autora (pública)
  @Get('author/:id')
  listByAuthor(@Param('id', ParseIntPipe) id: number) {
    return this.service.listByAuthor(id);
  }

  // Editar (autora o admin)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'psicologo')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEbookDto,
    @Req() req: any,
  ) {
    return this.service.update(id, req.user, dto);
  }

  // Borrar (autora o admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'psicologo')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.remove(id, req.user);
  }
}
