import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('availability')
export class Availability {
  @PrimaryGeneratedColumn() id: number;

  @ManyToOne(() => User, { eager: true })
  professional: User; // solo profesionales

  @Column({ type: 'timestamptz' }) from: Date;
  @Column({ type: 'timestamptz' }) to: Date;

  @Column({ default: true }) active: boolean;
}
