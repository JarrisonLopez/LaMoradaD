import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;

  @Column() name: string;

  @Column({ unique: true }) email: string;

  @Column({ select: false }) password: string; // para futuro login

  @ManyToOne(() => Role, (r) => r.users, { nullable: true, eager: true })
  role: Role | null;
}
