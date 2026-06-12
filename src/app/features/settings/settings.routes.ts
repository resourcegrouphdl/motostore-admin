import { Routes } from '@angular/router';
import { CanDeactivateFn } from '@angular/router';
import { SettingsShellComponent } from './settings-shell.component';

interface HasDirtyState { isDirty(): boolean; }
const themeGuard: CanDeactivateFn<HasDirtyState> = (c) =>
  c.isDirty() ? window.confirm('¿Salir sin guardar? Los cambios realizados se perderán.') : true;

export const settingsRoutes: Routes = [
  {
    path: '',
    component: SettingsShellComponent,
    children: [
      { path: '', redirectTo: 'warehouses', pathMatch: 'full' },
      {
        path: 'warehouses',
        loadComponent: () =>
          import('./warehouses/warehouses.component').then(m => m.WarehousesComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'theme',
        loadComponent: () =>
          import('./theme/theme-builder.component').then(m => m.ThemeBuilderComponent),
        canDeactivate: [themeGuard],
        title: 'Apariencia',
      },
      {
        path: 'users-roles',
        loadComponent: () =>
          import('./users-roles/users-roles.component').then(m => m.UsersRolesComponent),
        title: 'Usuarios y roles',
      },
      {
        path: 'fintechs',
        loadComponent: () =>
          import('./fintechs/fintechs-config.component').then(m => m.FintechsConfigComponent),
        title: 'Fintechs',
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./billing-config/billing-config.component').then(m => m.BillingConfigComponent),
        title: 'Facturación',
      },
      {
        path: 'whatsapp',
        loadComponent: () =>
          import('./whatsapp/whatsapp-config.component').then(m => m.WhatsappConfigComponent),
        title: 'WhatsApp Business',
      },
      {
        path: 'integrations',
        loadComponent: () =>
          import('./integrations/integrations.component').then(m => m.IntegrationsComponent),
        title: 'Integraciones',
      },
    ],
  },
];
