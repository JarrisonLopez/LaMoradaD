import { Controller, Get, Param } from '@nestjs/common';
import { MetricsLiteService } from './metrics-lite.service';

@Controller('metrics-lite') // => /api/metrics-lite por el globalPrefix('api')
export class MetricsLiteController {
  constructor(private readonly svc: MetricsLiteService) {}

  @Get(':professionalId')
  getLite(@Param('professionalId') pid: string) {
    return this.svc.getLite(+pid);
  }
}
