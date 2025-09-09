import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { EbooksService, CreateEbookDto, Ebook } from '../../services/ebooks.service';

@Component({
  selector: 'app-ebooks',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './ebooks.component.html',
  styleUrls: ['./ebooks.component.css']
})
export class EbooksComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(EbooksService);
  private snack = inject(MatSnackBar);

  loading = false;
  rows: Ebook[] = [];
  selectedFile: File | null = null;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    price: [''],
    fileUrl: [''] // si el usuario prefiere pegar URL en vez de subir archivo
  });

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.api.listMine().subscribe({
      next: (data) => (this.rows = data ?? []),
      error: (err) => console.error('[ebooks] listMine error', err),
    });
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.selectedFile = (input.files && input.files[0]) ? input.files[0] : null;
  }

  private buildDto(): CreateEbookDto {
    const v = this.form.value;
    const title = (v.title ?? '').toString().trim();
    const description = (v.description ?? '').toString().trim();
    const priceRaw: any = v.price;
    const fileUrlRaw = (v.fileUrl ?? '').toString().trim();

    const dto: CreateEbookDto = {
      title,
      ...(description ? { description } : {}),
      ...(priceRaw !== '' && priceRaw !== null && priceRaw !== undefined
        ? { price: Number(priceRaw) }
        : {}),
      ...(fileUrlRaw ? { fileUrl: fileUrlRaw } : {}),
    };
    return dto;
  }

  onSubmit() {
    if (this.loading) return;

    if (this.form.invalid) {
      this.snack.open('Completa el título', 'Ok', { duration: 2000 });
      return;
    }

    const dto = this.buildDto();
    this.loading = true;

    const req$ = this.selectedFile
      ? this.api.createWithFile(dto, this.selectedFile)
      : this.api.create(dto);

    req$.subscribe({
      next: (created) => {
        this.snack.open('Ebook creado', 'Ok', { duration: 1800 });
        this.rows = [created, ...this.rows];
        this.form.reset();
        this.selectedFile = null;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('[ebooks] create error', err);
        const msg =
          (Array.isArray(err?.error?.message)
            ? err.error.message.join(' | ')
            : err?.error?.message) ||
          (typeof err?.error === 'string' ? err.error : null) ||
          (err?.status ? `Error ${err.status}` : 'Error al crear ebook');
        this.snack.open(msg, 'Ok', { duration: 4000 });
      },
    });
  }
}
