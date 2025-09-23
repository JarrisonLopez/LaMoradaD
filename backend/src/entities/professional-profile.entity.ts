import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('professional_profiles')
export class ProfessionalProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User; // Debe tener role PROFESSIONAL

  @Column('varchar', { length: 200 })
  specialty: string; // p.ej., Terapia cognitivo-conductual

  @Column('int', { default: 0 })
  experienceYears: number;

  @Column('text', { nullable: true })
  services?: string; // CSV o JSON simple (según prefieras)

  @Column('text', { nullable: true })
  bio?: string;

  @Column('varchar', { nullable: true })
  photoUrl?: string; // /uploads/photos/xxx.jpg (si ya sirves /uploads)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
