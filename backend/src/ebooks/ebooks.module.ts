import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EbooksController } from './ebooks.controller';
import { EbooksService } from './ebooks.service';
import { Ebook } from '../entities/ebook.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ebook])],
  controllers: [EbooksController],
  providers: [EbooksService],
})
export class EbooksModule {}
