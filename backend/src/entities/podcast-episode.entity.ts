import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export type PodcastSourceType = 'UPLOAD' | 'URL';

@Entity('podcast_episodes')
export class PodcastEpisode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  category?: string;

  /** Ruta local o URL externa */
  @Column({ type: 'varchar', length: 260 })
  fileUrl: string;

  /** audio/mpeg | audio/wav | null si URL no verificada */
  @Column({ type: 'varchar', length: 80, nullable: true })
  mimeType: string | null;

  /** bytes; null si es URL */
  @Column({ type: 'int', nullable: true })
  size: number | null;

  /** UPLOAD o URL (para métricas/UX) */
  @Column({ type: 'varchar', length: 10, default: 'UPLOAD' })
  sourceType: PodcastSourceType;

  @ManyToOne(() => User, { eager: true })
  author: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
