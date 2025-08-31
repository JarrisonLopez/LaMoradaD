import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone:true,
  imports:[MatCardModule],
  template:`<div class="grid">
    <mat-card><h2>Usuarios</h2><p>Gestiona registros y roles.</p></mat-card>
    <mat-card><h2>Citas</h2><p>Agenda, cancela y consulta.</p></mat-card>
    <mat-card><h2>Disponibilidad</h2><p>Administra horarios.</p></mat-card>
  </div>`,
  styles:[`.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));}`]
})
export class DashboardComponent {}
