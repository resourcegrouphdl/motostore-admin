import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth, connectAuthEmulator } from '@angular/fire/auth';
import { getFirestore, provideFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { getStorage, provideStorage, connectStorageEmulator } from '@angular/fire/storage';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    // tenant va primero para que auth pueda leerlo si necesita
    provideHttpClient(withInterceptors([tenantInterceptor, authInterceptor])),

    // Firebase App
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // Firebase Auth — conecta al emulador en desarrollo
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators) {
        connectAuthEmulator(auth, `http://localhost:${environment.emulators!.authPort}`, { disableWarnings: true });
      }
      return auth;
    }),

    // Firestore — para notificaciones y stock en tiempo real
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, 'localhost', environment.emulators!.firestorePort);
      }
      return firestore;
    }),

    // Firebase Storage — upload directo de fotos desde el admin
    provideStorage(() => {
      const storage = getStorage();
      if (environment.useEmulators) {
        connectStorageEmulator(storage, 'localhost', environment.emulators!.storagePort);
      }
      return storage;
    }),
  ]
};
