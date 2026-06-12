import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'staff',
        loadChildren: () =>
          import('./features/staff/staff.routes').then(m => m.staffRoutes),
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('./features/inventory/inventory.routes').then(m => m.inventoryRoutes),
      },
      {
        path: 'crm',
        loadChildren: () =>
          import('./features/crm/crm.routes').then(m => m.crmRoutes),
      },
      {
        path: 'sales',
        loadChildren: () =>
          import('./features/sales/sales.routes').then(m => m.salesRoutes),
      },
      {
        path: 'billing',
        loadChildren: () =>
          import('./features/billing/billing.routes').then(m => m.billingRoutes),
      },
      {
        path: 'credit',
        loadChildren: () =>
          import('./features/credit/credit.routes').then(m => m.creditRoutes),
      },
      {
        path: 'collection',
        loadChildren: () =>
          import('./features/collection/collection.routes').then(m => m.collectionRoutes),
      },
      {
        path: 'whatsapp',
        loadChildren: () =>
          import('./features/whatsapp/whatsapp.routes').then(m => m.whatsappRoutes),
      },
      {
        path: 'accounting',
        loadChildren: () =>
          import('./features/accounting/accounting.routes').then(m => m.accountingRoutes),
      },
      {
        path: 'payroll',
        loadChildren: () =>
          import('./features/payroll/payroll.routes').then(m => m.payrollRoutes),
      },
      {
        path: 'analytics',
        loadChildren: () =>
          import('./features/analytics/analytics.routes').then(m => m.analyticsRoutes),
      },
      {
        path: 'workshop',
        loadChildren: () =>
          import('./features/workshop/workshop.routes').then(m => m.workshopRoutes),
      },
      {
        path: 'store-orders',
        loadChildren: () =>
          import('./features/store-orders/store-orders.routes').then(m => m.storeOrdersRoutes),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then(m => m.settingsRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
