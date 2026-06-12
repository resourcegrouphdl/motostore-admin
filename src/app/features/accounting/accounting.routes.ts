import { Routes } from '@angular/router';

export const accountingRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/accounting-list/accounting-list.component').then(m => m.AccountingListComponent),
    title: 'Contabilidad',
  },
];
