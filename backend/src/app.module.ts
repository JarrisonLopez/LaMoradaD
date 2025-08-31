import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';

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
    RolesModule,
    UsersModule,
    AppointmentsModule,
    AvailabilityModule,
  ],
})
export class AppModule {}
