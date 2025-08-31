import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone:true,
  imports:[ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatSnackBarModule],
  template: `
    <h2>Disponibilidad</h2>
    <form [formGroup]="fg" class="form" (ngSubmit)="add()">
      <mat-form-field appearance="outline"><mat-label>Professional ID</mat-label><input matInput formControlName="professionalId" type="number"></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Desde (ISO)</mat-label><input matInput formControlName="from" placeholder="2025-09-01T14:00:00Z"></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Hasta (ISO)</mat-label><input matInput formControlName="to" placeholder="2025-09-01T15:00:00Z"></mat-form-field>
      <button mat-flat-button color="primary" [disabled]="fg.invalid">Agregar</button>
    </form>

    <table mat-table [dataSource]="ds" class="mat-elevation-z1">
      <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>#</th><td mat-cell *matCellDef="let d">{{d.id}}</td></ng-container>
      <ng-container matColumnDef="pro"><th mat-header-cell *matHeaderCellDef>Pro</th><td mat-cell *matCellDef="let d">{{d.professionalId}}</td></ng-container>
      <ng-container matColumnDef="from"><th mat-header-cell *matHeaderCellDef>Desde</th><td mat-cell *matCellDef="let d">{{d.from}}</td></ng-container>
      <ng-container matColumnDef="to"><th mat-header-cell *matHeaderCellDef>Hasta</th><td mat-cell *matCellDef="let d">{{d.to}}</td></ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  `,
  styles:[`.form{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px} table{width:100%}`]
})
export class AvailabilityComponent {
  http = inject(HttpClient);
  fb = inject(FormBuilder);
  snack = inject(MatSnackBar);

  ds = new MatTableDataSource<any>([]);
  cols = ['id','pro','from','to'];

  fg = this.fb.group({
    professionalId:[null,[Validators.required]],
    from:['',[Validators.required]],
    to:['',[Validators.required]],
  });

  ngOnInit(){ this.load(); }
  load(){ this.http.get<any[]>('/api/availability').subscribe(d=> this.ds.data = d); }
  add(){
    if(this.fg.invalid) return;
    this.http.post('/api/availability', this.fg.getRawValue()).subscribe({
      next:()=>{ this.snack.open('Disponibilidad agregada','OK',{duration:2000}); this.fg.reset(); this.load(); },
      error:e=> this.snack.open(e.error?.message||'Error','OK',{duration:2500})
    });
  }
}
