import { Routes } from '@angular/router';

export const payrollRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/payroll-list/payroll-list.component').then(m => m.PayrollListComponent),
    title: 'Planilla',
  },
];
