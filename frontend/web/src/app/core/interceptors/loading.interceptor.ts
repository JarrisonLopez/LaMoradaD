import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { UiService } from '../../core/services/ui.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const ui = inject(UiService);
  ui.loading.set(true);
  return next(req).pipe(finalize(() => ui.loading.set(false)));
};
