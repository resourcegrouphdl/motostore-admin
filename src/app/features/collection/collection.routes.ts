import { Routes } from '@angular/router';

export const collectionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/collection-list/collection-list.component').then(m => m.CollectionListComponent),
    title: 'Cobranza',
  },
];
