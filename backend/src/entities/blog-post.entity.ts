import {
  Column, CreateDateColumn, Entity, Index, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn, Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('blog_posts')
@Unique(['slug'])
export class BlogPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ length: 180 })
  title: string;

  @Index()
  @Column({ length: 200 })
  slug: string; // para /blog/mi-titulo

  @Column({ type: 'text' })
  content: string; // admite markdown/HTML

  @Index()
  @Column({ length: 80 })
  category: string;

  @Column({ nullable: true, length: 260 })
  coverUrl?: string; // opcional

  @ManyToOne(() => User, { eager: true })
  author: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @Column({ default: true })
  isPublished: boolean; // para futuro estado borrador/publicado
}
