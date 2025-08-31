import { Component, ViewChild, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { map, of, switchMap } from 'rxjs';

type AvailItem =
  | { dayOfWeek: number; start?: string; end?: string; startTime?: string; endTime?: string } // semanal
  | { date: string; start?: string; end?: string; startTime?: string; endTime?: string }       // por fecha
  | { startsAt: string; endsAt: string };                                                      // ISO absolutos

@Component({
  standalone: true,
  selector: 'app-appointments',
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  imports: [
    ReactiveFormsModule, NgFor, NgIf,
    MatTableModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule
  ],
  template: `
    <h2>Citas</h2>

    <form class="grid" [formGroup]="fg" (ngSubmit)="create()">
      <mat-form-field appearance="outline">
        <mat-label>User ID*</mat-label>
        <input matInput type="number" formControlName="userId" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Professional ID*</mat-label>
        <input matInput type="number" formControlName="professionalId" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Fecha*</mat-label>
        <input matInput [matDatepicker]="picker" formControlName="date" required />
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Hora inicio*</mat-label>
        <mat-select formControlName="startTime" required>
          <mat-option *ngFor="let t of startOptions" [value]="t">{{t}}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Hora fin*</mat-label>
        <mat-select formControlName="endTime" required>
          <mat-option *ngFor="let t of endOptions" [value]="t">{{t}}</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-flat-button color="primary" [disabled]="fg.invalid || startOptions.length===0">
        Crear cita
      </button>
    </form>

    <p *ngIf="fg.value.professionalId && fg.value.date && startOptions.length===0"
       style="margin:8px 0; color:#a00">
      El profesional no tiene disponibilidad para la fecha elegida.
    </p>

    <table mat-table [dataSource]="ds" class="mat-elevation-z1">
      <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>#</th><td mat-cell *matCellDef="let a">{{a.id}}</td></ng-container>
      <ng-container matColumnDef="userId"><th mat-header-cell *matHeaderCellDef>User</th><td mat-cell *matCellDef="let a">{{a.userId}}</td></ng-container>
      <ng-container matColumnDef="professionalId"><th mat-header-cell *matHeaderCellDef>Pro</th><td mat-cell *matCellDef="let a">{{a.professionalId}}</td></ng-container>
      <ng-container matColumnDef="startsAt"><th mat-header-cell *matHeaderCellDef>Inicio</th><td mat-cell *matCellDef="let a">{{a.startsAt}}</td></ng-container>
      <ng-container matColumnDef="endsAt"><th mat-header-cell *matHeaderCellDef>Fin</th><td mat-cell *matCellDef="let a">{{a.endsAt}}</td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let a"><button mat-button color="warn" (click)="cancel(a.id)">Cancelar</button></td></ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
    <mat-paginator [pageSize]="5" />
  `,
  styles: [`
    .grid{display:grid;grid-template-columns:repeat(6, minmax(180px,1fr));gap:12px;align-items:end;margin-bottom:12px}
    @media (max-width: 900px){ .grid{grid-template-columns:repeat(1, minmax(200px,1fr));} }
    table{width:100%}
  `]
})
export class AppointmentsComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  ds = new MatTableDataSource<any>([]);
  cols = ['id','userId','professionalId','startsAt','endsAt','actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  /** opciones visibles según disponibilidad */
  startOptions: string[] = [];
  endOptions: string[] = [];

  /** pasos de 15 minutos */
  readonly STEP_MIN = 15;

  fg = this.fb.group({
    userId: [null, Validators.required],
    professionalId: [null, Validators.required],
    date: [null as Date | null, Validators.required],
    startTime: ['', Validators.required], // HH:mm
    endTime: ['', Validators.required],   // HH:mm
  });

  ngOnInit(){
    this.loadAppointments();

    // Recalcula opciones cuando cambian profesional o fecha
    this.fg.get('professionalId')!.valueChanges
      .pipe(switchMap(() => this.rebuildOptions()))
      .subscribe();

    this.fg.get('date')!.valueChanges
      .pipe(switchMap(() => this.rebuildOptions()))
      .subscribe();

    // Ajusta opciones de fin cuando se elige inicio
    this.fg.get('startTime')!.valueChanges.subscribe(st => {
      this.endOptions = (this.startOptions || []).filter(t => this.compareHHmm(t, st!) > 0);
      // si la hora fin actual ya no es válida, límpiala
      if (!this.endOptions.includes(this.fg.value.endTime || '')) {
        this.fg.patchValue({ endTime: '' }, { emitEvent:false });
      }
    });
  }

  ngAfterViewInit(){ this.ds.paginator = this.paginator; }

  /** Crea cita */
  create(){
    if (this.fg.invalid) return;

    const v = this.fg.getRawValue();
    const startsAt = this.combineToIso(v.date!, v.startTime!);
    const endsAt   = this.combineToIso(v.date!, v.endTime!);

    if (new Date(startsAt) >= new Date(endsAt)) {
      this.snack.open('El fin debe ser mayor que el inicio', 'OK', { duration: 2500 });
      return;
    }

    this.http.post('/api/appointments', {
      userId: v.userId, professionalId: v.professionalId, startsAt, endsAt
    }).subscribe({
      next: () => { this.snack.open('Cita creada', 'OK', { duration: 2000 }); this.fg.patchValue({startTime:'', endTime:''}); this.loadAppointments(); },
      error: e => this.snack.open(e.error?.message || 'Error al crear', 'OK', { duration: 3000 })
    });
  }

  cancel(id:number){
    this.http.delete(`/api/appointments/${id}`).subscribe({
      next: () => { this.snack.open('Cita cancelada', 'OK', { duration: 2000 }); this.loadAppointments(); }
    });
  }

  /** ---------------------- helpers de disponibilidad ---------------------- */

  /** Recalcula startOptions según profesional + fecha */
  private rebuildOptions() {
    const proId = this.fg.value.professionalId;
    const date  = this.fg.value.date as Date | null;

    if (!proId || !date) {
      this.startOptions = [];
      this.endOptions = [];
      return of(null);
    }

    const ymd = this.toYMD(date);

    return this.http.get<AvailItem[]>(`/api/availability/professional/${proId}`).pipe(
      map(items => {
        // Normaliza slots de disponibilidad que coincidan con la fecha elegida
        const intervals = this.normalizeIntervalsForDate(items, date);
        // Une solapes, por si hay varios bloques
        const merged = this.mergeIntervals(intervals);
        // Genera pasos de 15 min solo dentro de esos intervalos
        this.startOptions = this.buildStepsFromIntervals(merged, this.STEP_MIN);
        // Forzamos recalcular fin
        const st = this.fg.value.startTime || '';
        this.endOptions = (st ? this.startOptions.filter(t => this.compareHHmm(t, st) > 0) : []);
      })
    );
  }

  /** Convierte diferentes formatos del API a intervalos [Date, Date] del día elegido */
  private normalizeIntervalsForDate(items: AvailItem[], date: Date): Array<[Date, Date]> {
    const res: Array<[Date, Date]> = [];
    const dow = date.getDay(); // 0-6

    for (const it of items || []) {
      // Caso 1: ISO absolutos
      if ('startsAt' in it && 'endsAt' in it) {
        const s = new Date(it.startsAt); const e = new Date(it.endsAt);
        if (this.sameYMD(s, date)) res.push([s, e]);
        continue;
      }

      // Determinar HH:mm
      const start = (it as any).startTime || (it as any).start;
      const end   = (it as any).endTime   || (it as any).end;
      if (!start || !end) continue;

      // Caso 2: por fecha exacta (YYYY-MM-DD)
      if ('date' in it && it.date) {
        if (it.date === this.toYMD(date)) {
          res.push([this.combine(date, start), this.combine(date, end)]);
        }
        continue;
      }

      // Caso 3: semanal por dayOfWeek
      if ('dayOfWeek' in it && (it as any).dayOfWeek !== undefined) {
        if ((it as any).dayOfWeek === dow) {
          res.push([this.combine(date, start), this.combine(date, end)]);
        }
      }
    }

    return res;
  }

  /** Une intervalos solapados */
  private mergeIntervals(intervals: Array<[Date, Date]>): Array<[Date, Date]> {
    if (intervals.length <= 1) return intervals.slice().sort((a,b)=>a[0].getTime()-b[0].getTime());
    const list = intervals.slice().sort((a,b)=>a[0].getTime()-b[0].getTime());
    const out: Array<[Date, Date]> = [];
    let [curS, curE] = list[0];
    for (let i=1;i<list.length;i++){
      const [s,e] = list[i];
      if (s <= curE) {
        if (e > curE) curE = e;
      } else {
        out.push([curS, curE]);
        [curS, curE] = [s, e];
      }
    }
    out.push([curS, curE]);
    return out;
  }

  /** Genera HH:mm en pasos de stepMin dentro de intervalos permitidos */
  private buildStepsFromIntervals(intervals: Array<[Date, Date]>, stepMin:number): string[] {
    const out: string[] = [];
    for (const [s,e] of intervals) {
      const d = new Date(s);
      while (d < e) {
        out.push(this.toHHmm(d));
        d.setMinutes(d.getMinutes()+stepMin);
      }
    }
    // El último “fin” no se agrega como inicio (para forzar fin > inicio)
    return Array.from(new Set(out));
  }

  /** ---------------------- utilidades varias ---------------------- */

  private loadAppointments(){ this.http.get<any[]>('/api/appointments').subscribe(a => this.ds.data = a); }

  private toYMD(d: Date){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  private sameYMD(a: Date, b: Date){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  private toHHmm(d: Date){ return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
  private combine(date: Date, hhmm: string){ const [h,m] = hhmm.split(':').map(Number); return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0); }
  private combineToIso(date: Date, hhmm: string){ return this.combine(date, hhmm).toISOString(); }
  private compareHHmm(a:string, b:string){ // >0 si a>b
    const [ah,am]=a.split(':').map(Number); const [bh,bm]=b.split(':').map(Number);
    return (ah*60+am)-(bh*60+bm);
  }
}
