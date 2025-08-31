// src/app/shared/components/loader/loader.component.ts
import { Component, computed } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgIf } from '@angular/common';
import { UiService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [MatProgressBarModule, NgIf],
  template: `<mat-progress-bar *ngIf="show()" mode="indeterminate"></mat-progress-bar>`,
  styles: [`:host { position: sticky; top:0; z-index: 1000; display:block; }`]
})
export class LoaderComponent {
  constructor(private ui: UiService) {}
  show = computed(() => this.ui.loading());
}
