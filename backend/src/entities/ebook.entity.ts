import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('ebooks')
export class Ebook {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  // usa int; si prefieres decimales, cambia a 'numeric' con precision/scale
  @Column({ type: 'int', nullable: true })
  price?: number | null;

  // 👇 especifica el tipo para evitar "Object"
  @Column({ type: 'varchar', length: 512, nullable: true })
  fileUrl?: string | null;

  @Column({ type: 'int' })
  authorId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'authorId' })
  author?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
