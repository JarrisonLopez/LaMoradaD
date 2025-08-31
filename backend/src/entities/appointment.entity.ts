import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn() id: number;

  // usuario que agenda
  @ManyToOne(() => User, { eager: true }) user: User;

  // profesional que atiende
  @ManyToOne(() => User, { eager: true }) professional: User;

  @Column({ type: 'timestamptz' }) startsAt: Date;
  @Column({ type: 'timestamptz' }) endsAt: Date;

  @Column({ default: 'scheduled' }) status: 'scheduled' | 'cancelled';
}
