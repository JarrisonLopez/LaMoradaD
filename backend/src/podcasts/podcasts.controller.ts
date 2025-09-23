// LaMorada/backend/src/podcasts/podcasts.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { PodcastsService } from './podcasts.service';
import { CreatePodcastDto } from './dto/create-podcast.dto';
import { CreatePodcastUrlDto } from './dto/create-podcast-url.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles as AllowRoles } from '../common/auth/roles.decorator';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

// Tipos MIME aceptados
const ALLOWED_MIME = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
]);

function sanitizeName(name: string) {
  return name.replace(/[^a-z0-9\-_\.]/gi, '_');
}

const storage = diskStorage({
  destination: (req, file, cb) => {
    const dest = join(process.cwd(), 'uploads', 'podcasts');
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const id = randomBytes(8).toString('hex');
    const safeBase = sanitizeName(
      file.originalname.replace(extname(file.originalname), ''),
    );
    cb(null, `${safeBase}_${id}${extname(file.originalname).toLowerCase()}`);
  },
});

const multerOptions = {
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req: any, file: Express.Multer.File, cb: Function) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(
        new BadRequestException('Formato no permitido. Solo MP3 o WAV'),
        false,
      );
    }
    cb(null, true);
  },
};

@ApiTags('podcasts')
@Controller('podcasts')
export class PodcastsController {
  constructor(private readonly service: PodcastsService) {}

  /** Subir archivo (psicólogo/admin) */
  @Post()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('psicologo', 'admin')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreatePodcastDto,
    @Req() req: any,
  ) {
    if (!file)
      throw new BadRequestException(
        'Archivo de audio requerido (MP3/WAV ≤ 50MB)',
      );
    const fileUrl = `/uploads/podcasts/${file.filename}`;
    return this.service.create(Number(req.user?.sub), dto, {
      fileUrl,
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  /** Crear por URL (psicólogo/admin) */
  @Post('url')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('psicologo', 'admin')
  async createByUrl(@Body() dto: CreatePodcastUrlDto, @Req() req: any) {
    return this.service.createByUrl(Number(req.user?.sub), dto);
  }

  /** Público: listado */
  @Get()
  async list() {
    return this.service.findAll();
  }

  /** Público: detalle */
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /** Eliminar (autor) */
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles('psicologo', 'admin')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.remove(id, Number(req.user?.sub));
  }
}
