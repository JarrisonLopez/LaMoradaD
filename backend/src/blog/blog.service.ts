import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { BlogPost } from '../entities/blog-post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../entities/user.entity';
import { toSlug } from './slug.util';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost) private readonly repo: Repository<BlogPost>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(authorId: number, dto: CreatePostDto) {
    const author = await this.users.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException('Autor no encontrado');

    const baseSlug = toSlug(dto.title);
    let slug = baseSlug;
    let i = 1;
    while (await this.repo.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }
    const post = this.repo.create({ ...dto, slug, author, isPublished: true });
    return this.repo.save(post);
  }

  async update(authorId: number, id: number, dto: UpdatePostDto) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    if (post.author?.id !== authorId) throw new NotFoundException('No puedes editar esta publicación');

    if (dto.title && dto.title !== post.title) {
      const baseSlug = toSlug(dto.title);
      let slug = baseSlug;
      let i = 1;
      while (await this.repo.findOne({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }
      post.slug = slug;
    }

    Object.assign(post, dto);
    return this.repo.save(post);
  }

  async remove(authorId: number, id: number) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    if (post.author?.id !== authorId) throw new NotFoundException('No puedes eliminar esta publicación');
    await this.repo.remove(post);
    return { ok: true };
  }

  async list(params: { q?: string; category?: string; page?: number; pageSize?: number }) {
    const { q, category, page = 1, pageSize = 10 } = params;
    const where: any = { isPublished: true };
    if (q) where.title = ILike(`%${q}%`);
    if (category) where.category = category;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: ['id', 'title', 'slug', 'category', 'coverUrl', 'createdAt', 'updatedAt', 'isPublished'],
      relations: ['author'],
    });
    return { items, total, page, pageSize };
  }

  async bySlug(slug: string) {
    const post = await this.repo.findOne({ where: { slug, isPublished: true } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    return post;
  }

  async byId(id: number) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    return post;
  }
}
