import { Routes } from '@angular/router';

export const whatsappRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/whatsapp-shell/whatsapp-shell.component').then(m => m.WhatsAppShellComponent),
  },
  {
    path: 'broadcast',
    loadComponent: () =>
      import('./pages/broadcast/broadcast.component').then(m => m.BroadcastComponent),
  },
];
