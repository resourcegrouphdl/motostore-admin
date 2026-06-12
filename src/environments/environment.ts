// Ambiente: LOCAL / DESARROLLO
// API apunta al Spring Boot local (puerto 8080)
// Firebase usa los emuladores locales (firebase emulators:start)
// Mismo proyecto Firebase que motostore-store (mvmotors-alcontado-front)
// appId diferente porque es una app registrada por separado en el mismo proyecto

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  tenantSlug: 'demo-store',          // local dev; en prod se deriva del subdominio
  useEmulators: true,
  firebase: {
    apiKey: 'AIzaSyC8FaO6In9jlwS9cj7xy_8MTcCCpdF1sGA',
    authDomain: 'mvmotors-alcontado-front.firebaseapp.com',
    projectId: 'mvmotors-alcontado-front',
    storageBucket: 'mvmotors-alcontado-front.firebasestorage.app',
    messagingSenderId: '403093531044',
    appId: '1:403093531044:web:e35a0159db18468766b931',
    measurementId: 'G-97GY9088KH'
  },
  emulators: {
    authPort: 9099,
    firestorePort: 8082,
    storagePort: 9199
  }
};
