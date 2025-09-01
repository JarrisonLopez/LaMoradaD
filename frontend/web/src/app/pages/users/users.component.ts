import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { RolesService } from '../../services/roles.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  // Datos
  users: any[] = [];
  roles: any[] = [];
  loading = false;

  // Formulario (template-driven)
  form = {
    name: '',
    email: '',
    password: '',
    roleId: undefined as number | undefined,
  };

  // Buscador
  query = '';

  constructor(private usersSvc: UsersService, private rolesSvc: RolesService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.usersSvc.list().subscribe({
      next: (u) => (this.users = u || []),
      complete: () => (this.loading = false),
    });
    this.rolesSvc.list().subscribe({
      next: (r) => (this.roles = r || []),
    });
  }

  add(): void {
    if (!this.form.name || !this.form.email || !this.form.password || !this.form.roleId) {
      return;
    }

    this.loading = true;
    this.usersSvc
      .create({
        name: this.form.name,
        email: this.form.email,
        password: this.form.password,
        roleId: this.form.roleId,
      })
      .subscribe({
        next: () => {
          this.form = { name: '', email: '', password: '', roleId: undefined };
          this.reload();
        },
        complete: () => (this.loading = false),
      });
  }

  // Filtro en tabla
  get filteredUsers() {
    const q = (this.query || '').toLowerCase().trim();
    if (!q) return this.users;
    return this.users.filter((u) =>
      [u?.name, u?.email, u?.role?.name]
        .filter(Boolean)
        .some((v: string) => (v || '').toLowerCase().includes(q))
    );
  }

  // Optimiza *ngFor
  trackById = (_: number, it: any) => it?.id ?? it?.email ?? _;
}
