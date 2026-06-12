import { Routes } from '@angular/router';

export const salesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/sale-list/sale-list.component').then(m => m.SaleListComponent),
  },
  {
    path: 'pos',
    loadComponent: () =>
      import('./pages/pos/pos.component').then(m => m.PosComponent),
    title: 'POS — Venta de repuestos',
  },
];
