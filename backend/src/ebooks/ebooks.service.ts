import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ebook } from '../entities/ebook.entity';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';
import { normalizeRole } from '../common/auth/role-normalizer';

@Injectable()
export class EbooksService {
  constructor(
    @InjectRepository(Ebook) private readonly repo: Repository<Ebook>,
  ) {}

  // Crear con el autor del token
  async create(authorId: number, dto: CreateEbookDto) {
    // Seguridad por si viene string en price
    const price =
      (dto as any).price === '' || (dto as any).price == null
        ? null
        : Number((dto as any).price);

    const ebook = this.repo.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      price: Number.isFinite(price) ? (price as number) : null,
      fileUrl: dto.fileUrl?.trim() || null,
      authorId, // 👈 clave foránea
    });

    return this.repo.save(ebook);
  }

  listAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  listByAuthor(authorId: number) {
    return this.repo.find({ where: { authorId }, order: { id: 'DESC' } });
  }

  async update(id: number, user: any, dto: UpdateEbookDto) {
    const ebook = await this.repo.findOne({ where: { id } });
    if (!ebook) throw new NotFoundException('Ebook no encontrado');

    const isOwner = ebook.authorId === user?.sub;
    const isAdmin = normalizeRole(user?.role) === 'admin';
    if (!isOwner && !isAdmin) throw new ForbiddenException('No autorizado');

    if (dto.title != null) ebook.title = dto.title.toString().trim();
    if (dto.description !== undefined) {
      ebook.description = dto.description?.toString().trim() || null;
    }
    if ((dto as any).price !== undefined) {
      const n = (dto as any).price === '' || (dto as any).price == null
        ? null
        : Number((dto as any).price);
      ebook.price = Number.isFinite(n as number) ? (n as number) : null;
    }
    if (dto.fileUrl !== undefined) {
      ebook.fileUrl = dto.fileUrl?.toString().trim() || null;
    }

    return this.repo.save(ebook);
  }

  async remove(id: number, user: any) {
    const ebook = await this.repo.findOne({ where: { id } });
    if (!ebook) throw new NotFoundException('Ebook no encontrado');

    const isOwner = ebook.authorId === user?.sub;
    const isAdmin = normalizeRole(user?.role) === 'admin';
    if (!isOwner && !isAdmin) throw new ForbiddenException('No autorizado');

    await this.repo.delete(id);
    return { ok: true };
  }
}
