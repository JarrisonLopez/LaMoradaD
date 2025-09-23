import { Module } from '@nestjs/common';
import { MetricsLiteController } from './metrics-lite.controller';
import { MetricsLiteService } from './metrics-lite.service';

@Module({
  controllers: [MetricsLiteController],
  providers: [MetricsLiteService],
})
export class MetricsLiteModule {}
