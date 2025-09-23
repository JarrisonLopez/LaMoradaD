import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';

// Si tienes un enum real, úsalo; si no, deja el string 'ADMIN'
export enum RoleName {
  ADMIN = 'ADMIN',
  PSYCHOLOGIST = 'PSYCHOLOGIST',
  PATIENT = 'PATIENT',
}

export async function seedAdmin(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  // 1) Asegura el rol ADMIN
  let adminRole = await roleRepo.findOne({
    where: { name: RoleName.ADMIN as any },
  });
  if (!adminRole) {
    adminRole = roleRepo.create({ name: RoleName.ADMIN as any });
    await roleRepo.save(adminRole);
  }

  // 2) Credenciales desde ENV
  const email = process.env.ADMIN_EMAIL || 'admin@lamorada.app';
  const plain = process.env.ADMIN_PASSWORD || 'Admin123*';
  const hash = await bcrypt.hash(plain, 10);

  // 3) Busca usuario con su relación 'role'
  let user = await userRepo.findOne({ where: { email }, relations: ['role'] });

  if (!user) {
    // Tu entidad tiene 'role', no 'roles'
    user = userRepo.create({
      email,
      password: hash,
      name: 'Administrador',
      role: adminRole,
    } as Partial<User>);
  } else {
    // opcional: resetear contraseña
    user.password = hash;
    // asigna rol admin si no lo tiene
    if (!user.role || (user.role as any).name !== RoleName.ADMIN) {
      user.role = adminRole;
    }
  }

  await userRepo.save(user);
  // eslint-disable-next-line no-console
  console.log(`✅ Admin listo: ${email}`);
}
