import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ebook } from './ebook.entity';
import { User } from './user.entity';

export type PurchaseStatus = 'PENDING' | 'PAID' | 'FAILED';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ebook, { eager: true })
  ebook: Ebook;

  @ManyToOne(() => User, { eager: true, nullable: true })
  user?: User | null;

  @Column({ type: 'varchar', length: 180 })
  buyerEmail: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: PurchaseStatus;

  // IDs de Stripe
  @Column({ type: 'varchar', length: 120, nullable: true })
  stripeSessionId?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  stripePaymentIntentId?: string | null;

  // Token de descarga firmado
  @Column({ type: 'varchar', length: 120, nullable: true })
  downloadToken?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  downloadTokenExpiresAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
