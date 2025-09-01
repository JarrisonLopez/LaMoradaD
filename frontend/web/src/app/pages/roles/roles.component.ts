import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../../services/roles.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent {
  roles: Array<{ id: number; name: string }> = [];
  loading = false;
  form = { name: '' };
  query = '';

  constructor(private rolesSvc: RolesService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.rolesSvc.list().subscribe({
      next: (r) => (this.roles = r || []),
      complete: () => (this.loading = false),
    });
  }

  create(): void {
    if (!this.form.name.trim()) return;
    this.loading = true;
    this.rolesSvc.create(this.form.name.trim()).subscribe({
      next: () => {
        this.form = { name: '' };
        this.reload();
      },
      complete: () => (this.loading = false),
    });
  }

  delete(role: { id: number; name: string }) {
    // @ts-ignore
    if (typeof this.rolesSvc.delete === 'function') {
      // @ts-ignore
      this.rolesSvc.delete(role.id).subscribe(() => this.reload());
    }
  }

  get filteredRoles() {
    const q = this.query.toLowerCase().trim();
    if (!q) return this.roles;
    return this.roles.filter((r) => r.name.toLowerCase().includes(q));
  }

  trackById = (_: number, it: any) => it?.id ?? _;
}
