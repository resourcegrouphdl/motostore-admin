// Ambiente: PRODUCCIÓN
// API apunta al backend en Cloud Run (actualizar URL cuando esté desplegado)
// Firebase usa los servicios reales de mvmotors-alcontado-front

export const environment = {
  production: true,
  apiUrl: 'https://motostore-api-749765863620.southamerica-east1.run.app',
  tenantSlug: '',                            // En prod se deriva del subdominio
  useEmulators: false,
  emulators: {
    authPort: 9099,
    firestorePort: 8082,
    storagePort: 9199
  },
  firebase: {
    apiKey: 'AIzaSyC8FaO6In9jlwS9cj7xy_8MTcCCpdF1sGA',
    authDomain: 'mvmotors-alcontado-front.firebaseapp.com',
    projectId: 'mvmotors-alcontado-front',
    storageBucket: 'mvmotors-alcontado-front.firebasestorage.app',
    messagingSenderId: '403093531044',
    appId: '1:403093531044:web:e35a0159db18468766b931',
    measurementId: 'G-97GY9088KH'
  }
};
