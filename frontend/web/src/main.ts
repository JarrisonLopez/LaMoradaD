// LaMorada/frontend/web/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// 👇 NUEVO
import { registerLocaleData } from '@angular/common';
import esCO from '@angular/common/locales/es-CO';
registerLocaleData(esCO);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
