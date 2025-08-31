import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';

// 👇 Interceptores
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // 👇 HttpClient + interceptores en orden:
    // 1) loading -> enciende/apaga barra
    // 2) auth    -> agrega Authorization si hay token
    // 3) error   -> muestra toast con mensaje de error
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,
        authInterceptor,
        errorInterceptor,
      ])
    ),

    provideAnimations(), // requiere @angular/animations instalado
    importProvidersFrom(FormsModule, ReactiveFormsModule),
  ],
};
