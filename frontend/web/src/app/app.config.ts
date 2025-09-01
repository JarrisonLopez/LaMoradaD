// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
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

    // HttpClient + interceptores (orden importa):
    // 1) loading -> enciende/apaga barra
    // 2) auth    -> agrega Authorization si hay token
    // 3) error   -> muestra toast con mensaje de error
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])),

    provideAnimations(), // requiere @angular/animations instalado

    // Formularios (template-driven + reactive) disponibles globalmente
    importProvidersFrom(FormsModule, ReactiveFormsModule),

    // Datepicker y formatos en español
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
  ],
};
