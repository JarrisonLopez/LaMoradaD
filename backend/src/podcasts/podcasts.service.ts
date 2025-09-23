import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PodcastEpisode } from '../entities/podcast-episode.entity';
import { CreatePodcastDto } from './dto/create-podcast.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class PodcastsService {
  constructor(
    @InjectRepository(PodcastEpisode) private readonly repo: Repository<PodcastEpisode>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(authorId: number, dto: CreatePodcastDto, fileMeta: { fileUrl: string; mimeType: string; size: number }) {
    const author = await this.users.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException('Autor no encontrado');

    const ep = this.repo.create({
      ...dto,
      ...fileMeta,
      sourceType: 'UPLOAD',
      author,
    });
    return this.repo.save(ep);
  }

  async createByUrl(
    authorId: number,
    dto: { title: string; description?: string; category?: string; audioUrl: string }
  ) {
    const author = await this.users.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException('Autor no encontrado');

    const url = dto.audioUrl.trim();

    // ✅ Validar que sea una URL válida (sin forzar extensión .mp3/.wav)
    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      throw new BadRequestException('La URL no es válida');
    }

    const ep = this.repo.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      fileUrl: url,
      mimeType: null, // ya no obligamos a mp3/wav
      size: null,
      sourceType: 'URL',
      author,
    });
    return this.repo.save(ep);
  }

  async findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number) {
    const ep = await this.repo.findOne({ where: { id } });
    if (!ep) throw new NotFoundException('Episodio no encontrado');
    return ep;
  }

  async remove(id: number, requesterId: number) {
    const ep = await this.findOne(id);
    if (ep.author?.id !== requesterId) {
      throw new NotFoundException('No tienes permiso para eliminar este episodio');
    }
    await this.repo.remove(ep);
    return { ok: true };
  }
}
