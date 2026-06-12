import { Routes } from '@angular/router';

export const workshopRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/workshop-list/workshop-list.component')
        .then(m => m.WorkshopListComponent),
  },
];
