import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsLiteService {
  async getLite(professionalId: number) {
    // Devuelve algo fijo para validar la ruta
    return { visits: 0, reservations: 0, sales: 0, professionalId };
  }
}
