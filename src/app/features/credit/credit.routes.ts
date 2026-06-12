import { Routes } from '@angular/router';

export const creditRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/credit-list/credit-list.component').then(m => m.CreditListComponent),
    title: 'Expedientes de crédito',
  },
];
