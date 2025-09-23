import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';

type UserRole = 'admin' | 'psicologo' | 'usuario';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = computed(() => this.auth.user());
  isLoggedIn = computed(() => this.auth.isLoggedIn());

  roleLabel(role?: string): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'psicologo':
        return 'Psicólogo';
      case 'usuario':
        return 'Usuario';
      default:
        return '';
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
