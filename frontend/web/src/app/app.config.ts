// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';

// Interceptores
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Locale global para Datepicker de Angular Material
import { MAT_DATE_LOCALE } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // HttpClient + interceptores (orden importa)
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])),

    provideAnimations(),

    // Formularios globales
    importProvidersFrom(FormsModule, ReactiveFormsModule),

    // 👇 Locale global de Angular (pipes de currency/date, etc.)
    { provide: LOCALE_ID, useValue: 'es-CO' },

    // 👇 Opcional: Datepicker en español Colombia
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
  ],
};
