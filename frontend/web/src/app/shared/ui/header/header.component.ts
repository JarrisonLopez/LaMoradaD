import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';

/* Angular Material (opcional pero recomendado para accesibilidad/teclas) */
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  // Si luego integras Auth real, puedes leer el estado aquí para mostrar/ocultar botones
  isLoggedIn = false;
}
