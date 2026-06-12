import { Routes } from '@angular/router';

export const storeOrdersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./store-orders.component').then(m => m.StoreOrdersComponent),
  },
];
