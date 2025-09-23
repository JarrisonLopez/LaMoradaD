import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { EbooksModule } from './ebooks/ebooks.module';
import { AuthModule } from './auth/auth.module';
import { PodcastsModule } from './podcasts/podcasts.module';
import { BlogModule } from './blog/blog.module'; // 👈 NUEVO
import { PaymentsModule } from './payments/payments.module'; // 👈 debe existir este archivo y exportar la clase
import { MetricsLiteModule } from './metrics-lite/metrics-lite.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: parseInt(config.get<string>('DB_PORT') ?? '5432', 10),
        username: config.get<string>('DB_USER') ?? 'postgres',
        password: config.get<string>('DB_PASS') ?? 'postgres',
        database: config.get<string>('DB_NAME') ?? 'lamorada_db',
        autoLoadEntities: true,
        synchronize: true, // ⚠️ Solo DEV. En PROD usa migrations.
        // logging: ['query','error'], // opcional
      }),
    }),

    // Orden recomendado
    RolesModule,
    UsersModule,
    AvailabilityModule,
    AppointmentsModule,
    EbooksModule,
    AuthModule,

    PodcastsModule,
    BlogModule, // 👈 NUEVO
    PaymentsModule,
    MetricsLiteModule,
  ],
})
export class AppModule {}
