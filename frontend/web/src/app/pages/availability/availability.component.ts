import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AvailabilityService, Availability, SlotsResponse } from '../../services/availability.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.css'],
})
export class AvailabilityComponent {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private api = inject(AvailabilityService);
  private auth = inject(AuthService);

  times = this.buildTimes();
  minEndDate: Date | null = null;

  // Lista de mis disponibilidades
  myAvail: Availability[] = [];

  // Slots del día seleccionado (usamos Reactive Forms en vez de ngModel)
  selectedDateCtrl = new FormControl<Date | null>(null);
  slots: SlotsResponse | null = null;

  // Control de eliminación en curso
  deletingIds = new Set<number>();

  form = this.fb.group({
    fromDate: [null as Date | null, Validators.required],
    toDate:   [null as Date | null, Validators.required],
    fromTime: ['08:00', Validators.required],
    toTime:   ['16:00', Validators.required],
  });

  ngOnInit() {
    this.loadMine();
  }

  loadMine() {
    this.api.listMine().subscribe({
      next: (rows) => {
        // Ordenar últimas primero por 'from' DESC
        this.myAvail = (rows || []).sort(
          (a, b) => new Date(b.from).getTime() - new Date(a.from).getTime()
        );
      },
      error: (e) => console.error('[availability] listMine error', e),
    });
  }

  onFromDateChange(date: Date | null) {
    this.minEndDate = date;
    if (date && this.form.value.toDate && this.form.value.toDate < date) {
      this.form.patchValue({ toDate: date });
    }
  }

  private buildTimes(): string[] {
    const out: string[] = [];
    for (let h = 6; h <= 22; h++) {
      for (const m of [0, 30]) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        out.push(`${hh}:${mm}`);
      }
    }
    return out;
  }

  private combine(date: Date, time: string): string {
    const [hh, mm] = time.split(':').map(Number);
    // Construcción en horario local (sin UTC explícito)
    const local = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hh,
      mm,
      0,
      0
    );
    return local.toISOString();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.snack.open('Selecciona el rango de fechas y las horas.', 'Ok', { duration: 2500 });
      return;
    }
    const { fromDate, toDate, fromTime, toTime } = this.form.value;
    const start = this.combine(fromDate!, fromTime!);
    const end   = this.combine(toDate!,   toTime!);

    if (new Date(start) >= new Date(end)) {
      this.snack.open('La hora/fecha inicial debe ser menor que la final.', 'Ok', { duration: 2500 });
      return;
    }

    this.api.create({ start, end }).subscribe({
      next: () => {
        this.snack.open('Disponibilidad agregada', 'Ok', { duration: 1800 });
        this.loadMine();
        // Reset conservando horas por defecto
        this.form.patchValue({ fromDate: null, toDate: null, fromTime: '08:00', toTime: '16:00' });
      },
      error: (e) => {
        const msg = e?.error?.message || 'Error al guardar disponibilidad';
        this.snack.open(msg, 'Ok', { duration: 3000 });
        console.error('[availability] create error', e);
      },
    });
  }

  // Eliminar (soft delete en backend)
  onDelete(id: number) {
    const ok = window.confirm('¿Eliminar esta disponibilidad?');
    if (!ok) return;

    this.deletingIds.add(id);
    this.api.delete(id).subscribe({
      next: () => {
        // Actualización optimista: quitar de la lista
        this.myAvail = this.myAvail.filter(a => a.id !== id);
        this.snack.open('Disponibilidad eliminada', 'Ok', { duration: 1600 });
      },
      error: (e) => {
        const msg = e?.error?.message || 'No se pudo eliminar';
        this.snack.open(msg, 'Ok', { duration: 3000 });
        console.error('[availability] delete error', e);
      },
      complete: () => {
        this.deletingIds.delete(id);
      }
    });
  }

  // Carga slots del día seleccionado
  loadSlotsForSelectedDay() {
    const user = this.auth.user();
    const id = user?.id;
    if (!id) {
      this.snack.open('No se encontró el usuario', 'Ok', { duration: 2000 });
      return;
    }
    const picked = this.selectedDateCtrl.value;
    if (!picked) {
      this.snack.open('Elige una fecha para ver slots', 'Ok', { duration: 2000 });
      return;
    }
    const yyyyMMdd = picked.toISOString().slice(0, 10);
    this.api.getSlotsFor(id, yyyyMMdd).subscribe({
      next: (res) => (this.slots = res),
      error: (e) => {
        const msg = e?.error?.message || 'No se pudieron cargar los slots';
        this.snack.open(msg, 'Ok', { duration: 3000 });
        console.error('[availability] slots error', e);
      },
    });
  }
}
