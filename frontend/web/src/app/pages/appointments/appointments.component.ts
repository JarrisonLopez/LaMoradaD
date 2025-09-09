import { Component, ViewChild, inject, DestroyRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, DatePipe } from '@angular/common';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type Slot = { start: string; end: string; available: boolean };
type SlotsResponse = { professionalId: number; date: string; interval: number; slots: Slot[] };
type Lite = { id: number; name: string; email?: string };
type MeResp = { id: number; name?: string; role?: any };
type AppointmentRow = {
  id: number;
  user?: { id: number; name?: string } | null;
  professional?: { id: number; name?: string } | null;
  startsAt: string;
  endsAt: string;
  status?: string;
};

@Component({
  standalone: true,
  selector: 'app-appointments',
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  imports: [
    ReactiveFormsModule,
    NgFor,
    NgIf,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 class="title">Citas</h2>

    <form class="grid" [formGroup]="fg" (ngSubmit)="create()">

      <!-- Paciente (solo psicólogo/admin) -->
      <mat-form-field appearance="outline" *ngIf="!isUser">
        <mat-label>Paciente***</mat-label>
        <mat-select formControlName="userId" required>
          <mat-option *ngFor="let u of patients" [value]="u.id">
            {{ u.name }} (ID {{ u.id }})
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Profesional -->
      <mat-form-field appearance="outline" *ngIf="isUser; else proSelf">
        <mat-label>Profesional***</mat-label>
        <mat-select formControlName="professionalId" required>
          <mat-option *ngFor="let p of professionals" [value]="p.id">
            {{ p.name }} (ID {{ p.id }})
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Psicólogo: profesional fijo (tú) -->
      <ng-template #proSelf>
        <mat-form-field appearance="outline">
          <mat-label>Profesional</mat-label>
          <input matInput [value]="proDisplay" disabled />
        </mat-form-field>
      </ng-template>

      <!-- Fecha -->
      <mat-form-field appearance="outline">
        <mat-label>Fecha***</mat-label>
        <input
          matInput
          placeholder="dd/mm/aaaa"
          [matDatepicker]="picker"
          formControlName="date"
          required
          [matDatepickerFilter]="dateFilter"
          readonly
          (focus)="picker.open()"
          (click)="picker.open()"
        />
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

      <!-- Hora inicio -->
      <mat-form-field appearance="outline">
        <mat-label>Hora inicio***</mat-label>
        <mat-select formControlName="startTime" required [disabled]="startOptions.length === 0">
          <mat-option *ngFor="let t of startOptions" [value]="t">{{ t }}</mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Hora fin -->
      <mat-form-field appearance="outline">
        <mat-label>Hora fin***</mat-label>
        <mat-select formControlName="endTime" required [disabled]="endOptions.length === 0">
          <mat-option *ngFor="let t of endOptions" [value]="t">{{ t }}</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-flat-button color="primary" [disabled]="!canSubmit">
        Crear cita
      </button>
    </form>

    <p *ngIf="fg.value.date && startOptions.length === 0" class="warn">
      No hay disponibilidad para la fecha elegida.
    </p>

    <table mat-table [dataSource]="ds" class="mat-elevation-z1">
      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef>#</th>
        <td mat-cell *matCellDef="let a">{{ a.id }}</td>
      </ng-container>

      <ng-container matColumnDef="user">
        <th mat-header-cell *matHeaderCellDef>Paciente</th>
        <td mat-cell *matCellDef="let a">{{ a.user?.name || ('ID ' + a.user?.id) }}</td>
      </ng-container>

      <ng-container matColumnDef="pro">
        <th mat-header-cell *matHeaderCellDef>Profesional</th>
        <td mat-cell *matCellDef="let a">{{ a.professional?.name || ('ID ' + a.professional?.id) }}</td>
      </ng-container>

      <ng-container matColumnDef="startsAt">
        <th mat-header-cell *matHeaderCellDef>Inicio</th>
        <td mat-cell *matCellDef="let a">{{ a.startsAt | date:'short' }}</td>
      </ng-container>

      <ng-container matColumnDef="endsAt">
        <th mat-header-cell *matHeaderCellDef>Fin</th>
        <td mat-cell *matCellDef="let a">{{ a.endsAt | date:'short' }}</td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let a">{{ a.status || '—' }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let a">
          <button mat-button color="warn" (click)="cancel(a.id)">Cancelar</button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols"></tr>
    </table>
    <mat-paginator [pageSize]="5" />
  `,
  styles: [`
    .title { margin: 12px 0 16px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(180px, 1fr));
      gap: 12px;
      align-items: end;
      margin-bottom: 12px;
    }
    @media (max-width: 900px) {
      .grid { grid-template-columns: repeat(1, minmax(200px, 1fr)); }
    }
    table { width: 100%; }
    .warn { margin: 8px 0; color: #a00; }
  `],
})
export class AppointmentsComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  ds = new MatTableDataSource<AppointmentRow>([]);
  cols = ['id', 'user', 'pro', 'startsAt', 'endsAt', 'status', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  isUser = false;
  isPsych = false;

  patients: Lite[] = [];
  professionals: Lite[] = [];

  proDisplay = 'Tu perfil';
  startOptions: string[] = [];
  endOptions: string[] = [];
  private slotsOfDay: Slot[] = [];
  dateFilter: (d: Date | null) => boolean = () => true;

  fg = this.fb.group({
    userId: [null as number | null],                 // requerido sólo si psicólogo
    professionalId: [null as number | null],         // requerido si usuario
    date: [null as Date | null, Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
  });

  /** Habilitamos si hay selección válida en todos los campos requeridos según el rol */
  get canSubmit() {
    const v = this.fg.getRawValue();
    const hasDate = !!this.fg.value.date;
    const hasStart = !!v.startTime;
    const hasEnd = !!v.endTime;
    const hasPro = this.isUser ? !!v.professionalId : true;
    const hasPatient = this.isPsych ? !!v.userId : true;
    return hasDate && hasStart && hasEnd && hasPro && hasPatient;
  }

  ngOnInit() {
    this.http.get<MeResp>('/api/users/me').subscribe({
      next: (me) => {
        const myId = me?.id ?? null;
        const roleName = typeof me?.role === 'string' ? me.role : (me?.role as any)?.name;
        this.isUser = roleName === 'usuario';
        this.isPsych = roleName === 'psicologo';

        if (this.isPsych) {
          this.fg.get('userId')!.setValidators([Validators.required]);
          this.fg.get('userId')!.updateValueAndValidity({ emitEvent: false });

          this.fg.get('professionalId')!.setValue(myId, { emitEvent: false });
          this.fg.get('professionalId')!.disable({ emitEvent: false });
          this.proDisplay = `${me?.name ?? 'Profesional'} (Tú)`;
          if (myId) this.buildDateFilterFromAvailability(myId);

          this.http.get<Lite[]>('/api/users/patients').subscribe({
            next: (rows) => (this.patients = rows || []),
            error: () => this.snack.open('No pude cargar pacientes', 'OK', { duration: 2500 }),
          });
        } else {
          this.fg.get('professionalId')!.setValidators([Validators.required]);
          this.fg.get('professionalId')!.updateValueAndValidity({ emitEvent: false });

          this.http.get<Lite[]>('/api/users/professionals').subscribe({
            next: (rows) => (this.professionals = rows || []),
            error: () => this.snack.open('No pude cargar profesionales', 'OK', { duration: 2500 }),
          });
          this.loadMyAppointments();
        }

        // Cambio de profesional (modo usuario)
        this.fg.get('professionalId')!.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((pid) => {
            if (!pid) return;
            this.buildDateFilterFromAvailability(pid as number);
            this.resetSlots();
            const d = this.fg.value.date;
            if (d) {
              const ymd = d.toISOString().slice(0, 10);
              this.loadSlotsFor(pid as number, ymd);
              this.loadAppointmentsForDate(ymd);
            }
          });
      },
      error: () => this.snack.open('No pude obtener tu perfil', 'OK', { duration: 2500 }),
    });

    // Elegir fecha
    this.fg.get('date')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((d) => {
        this.resetSlots();
        if (!d) return;
        const ymd = d.toISOString().slice(0, 10);

        const proId = this.fg.getRawValue().professionalId as number | null;
        if (!proId) {
          this.snack.open('Elige un profesional primero', 'OK', { duration: 1800 });
          return;
        }
        this.loadSlotsFor(proId, ymd);
        this.loadAppointmentsForDate(ymd);
      });

    // Elegir hora inicio -> construir horas fin encadenadas
    this.fg.get('startTime')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((st) => {
        this.endOptions = this.buildEndOptionsFromStart(st || '');
        this.fg.patchValue({ endTime: this.endOptions[0] || '' }, { emitEvent: false });
      });
  }

  ngAfterViewInit() { this.ds.paginator = this.paginator; }

  create() {
    if (!this.canSubmit) return;
    const v = this.fg.getRawValue();
    const date = this.fg.value.date!;
    const startsAt = this.combineToISO(date!, v.startTime!);
    const endsAt   = this.combineToISO(date!, v.endTime!);

    const proId = Number(v.professionalId);
    if (!proId) {
      this.snack.open('Profesional inválido', 'OK', { duration: 2000 });
      return;
    }

    const payload: any = { professionalId: proId, startsAt, endsAt };
    if (this.isPsych && v.userId) payload.userId = v.userId;

    this.http.post('/api/appointments', payload).subscribe({
      next: () => {
        this.snack.open('Cita creada', 'OK', { duration: 2000 });
        this.fg.patchValue({ startTime: '', endTime: '' });
        const d = this.fg.value.date!;
        const ymd = d.toISOString().slice(0, 10);
        this.loadAppointmentsForDate(ymd);
        this.loadSlotsFor(proId, ymd); // refresca disponibilidad
      },
      error: (e) => this.snack.open(e?.error?.message || 'Error al crear', 'OK', { duration: 3000 }),
    });
  }

  cancel(id: number) {
    this.http.delete(`/api/appointments/${id}`).subscribe({
      next: () => {
        this.snack.open('Cita cancelada', 'OK', { duration: 2000 });
        const d = this.fg.value.date;
        if (d) this.loadAppointmentsForDate(d.toISOString().slice(0, 10));
        else if (this.isUser) this.loadMyAppointments();
      },
      error: (e) => this.snack.open(e?.error?.message || 'No se pudo cancelar', 'OK', { duration: 3000 }),
    });
  }

  // ===== listados =====
  private loadMyAppointments() {
    this.http.get<AppointmentRow[]>(`/api/appointments`).subscribe({
      next: (rows) => (this.ds.data = rows || []),
      error: () => this.snack.open('No se pudieron cargar tus citas', 'OK', { duration: 2500 }),
    });
  }
  private loadAppointmentsForDate(yyyyMMdd: string) {
    this.http.get<AppointmentRow[]>(`/api/appointments`, {
      params: new HttpParams().set('date', yyyyMMdd),
    }).subscribe({
      next: (rows) => (this.ds.data = rows || []),
      error: () => this.snack.open('No se pudo cargar la agenda del día', 'OK', { duration: 2500 }),
    });
  }

  // ===== disponibilidad / slots =====
  private buildDateFilterFromAvailability(proId: number) {
    this.http.get<Array<{ from: string; to: string }>>(`/api/availability/professional/${proId}`)
      .subscribe({
        next: (wins) => {
          const days = new Set<string>();
          for (const w of wins || []) {
            const from = new Date(w.from);
            const to = new Date(w.to);
            const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
            const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
            while (d <= end) {
              days.add(d.toISOString().slice(0, 10));
              d.setUTCDate(d.getUTCDate() + 1);
            }
          }
          this.dateFilter = (date: Date | null) => !!date && days.has(date.toISOString().slice(0, 10));
        },
        error: () => this.snack.open('No se pudo cargar la disponibilidad', 'OK', { duration: 2500 }),
      });
  }
  private fetchSlots(proId: number, yyyyMMdd: string) {
    const params = new HttpParams().set('date', yyyyMMdd);
    return this.http.get<SlotsResponse>(`/api/availability/professional/${proId}/slots`, { params });
  }
  private loadSlotsFor(proId: number, yyyyMMdd: string) {
    this.fetchSlots(proId, yyyyMMdd).subscribe({
      next: (res) => {
        this.slotsOfDay = res.slots
          .filter((s) => s.available)
          .sort((a, b) => this.compareHHmm(a.start, b.start));

        this.startOptions = Array.from(new Set(this.slotsOfDay.map((s) => s.start)));

        // Autoseleccionar el primer inicio disponible
        const prevStart = this.fg.value.startTime || '';
        if (this.startOptions.length > 0 && (!prevStart || !this.startOptions.includes(prevStart))) {
          this.fg.patchValue({ startTime: this.startOptions[0] }, { emitEvent: true });
        } else {
          this.endOptions = this.buildEndOptionsFromStart(prevStart);
          this.fg.patchValue({ endTime: this.endOptions[0] || '' }, { emitEvent: false });
        }
      },
      error: () => this.snack.open('No se pudieron cargar los slots', 'OK', { duration: 2500 }),
    });
  }

  // ===== util =====
  private resetSlots() {
    this.startOptions = [];
    this.endOptions = [];
    this.slotsOfDay = [];
    this.fg.patchValue({ startTime: '', endTime: '' }, { emitEvent: false });
  }

  private buildEndOptionsFromStart(start: string): string[] {
    if (!start) return [];
    const slots = this.slotsOfDay.slice().sort((a, b) => this.compareHHmm(a.start, b.start));
    const i0 = slots.findIndex(s => s.start === start);
    if (i0 < 0) return [];
    const out: string[] = [];
    let i = i0;
    out.push(slots[i].end);
    while (i + 1 < slots.length && slots[i + 1].start === slots[i].end) {
      i++;
      out.push(slots[i].end);
    }
    return Array.from(new Set(out));
  }

  private combineToISO(date: Date, hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    const local = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
    return local.toISOString();
  }
  private compareHHmm(a: string, b: string) {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  }
}
