import { Routes } from '@angular/router';
import { InventoryShellComponent } from './inventory-shell.component';

export const inventoryRoutes: Routes = [
  {
    path: '',
    component: InventoryShellComponent,
    children: [
      { path: '', redirectTo: 'motos', pathMatch: 'full' },
      {
        path: 'motos',
        loadComponent: () =>
          import('./pages/moto-list/moto-list.component').then(m => m.MotoListComponent),
      },
      {
        path: 'repuestos',
        loadComponent: () =>
          import('./pages/repuesto-list/repuesto-list.component').then(m => m.RepuestoListComponent),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./pages/stock-alerts/stock-alerts.component').then(m => m.StockAlertsComponent),
      },
      {
        path: 'aging',
        loadComponent: () =>
          import('./pages/inventory-aging/inventory-aging.component').then(m => m.InventoryAgingComponent),
      },
      {
        path: 'purchase-orders',
        loadComponent: () =>
          import('./pages/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent),
      },
    ],
  },
];
