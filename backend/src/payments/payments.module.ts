import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Purchase } from '../entities/purchase.entity';
import { Ebook } from '../entities/ebook.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, Ebook])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
