import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { EbooksModule } from './ebooks/ebooks.module';
import { AuthModule } from './auth/auth.module';


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
        synchronize: true, // ⚠️ solo DEV
      }),
    }),
    // Orden recomendado: primero roles, luego users
    RolesModule,
    UsersModule,
    AvailabilityModule,
    AppointmentsModule,
    EbooksModule,   // ← agrega el módulo de ebooks aquí
    AuthModule,
  ],
})
export class AppModule {}
