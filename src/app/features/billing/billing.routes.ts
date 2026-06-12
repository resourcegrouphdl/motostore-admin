import { Routes } from '@angular/router';

export const billingRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/billing-list/billing-list.component').then(m => m.BillingListComponent),
  },
];
