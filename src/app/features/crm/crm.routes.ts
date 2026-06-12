import { Routes } from '@angular/router';
import { CrmShellComponent } from './crm-shell.component';

export const crmRoutes: Routes = [
  {
    path: '',
    component: CrmShellComponent,
    children: [
      { path: '', redirectTo: 'customers', pathMatch: 'full' },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/customer-list/customer-list.component').then(m => m.CustomerListComponent),
      },
      {
        path: 'pipeline',
        loadComponent: () =>
          import('./pages/pipeline/pipeline.component').then(m => m.PipelineComponent),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./pages/lead-list/lead-list.component').then(m => m.LeadListComponent),
      },
      {
        path: 'team-ranking',
        loadComponent: () =>
          import('./pages/team-ranking/team-ranking.component').then(m => m.TeamRankingComponent),
      },
      {
        path: 'my-portfolio',
        loadComponent: () =>
          import('./pages/my-portfolio/my-portfolio.component').then(m => m.MyPortfolioComponent),
        title: 'Mi portafolio',
      },
      {
        path: 'goals-config',
        loadComponent: () =>
          import('./pages/goals-config/goals-config.component').then(m => m.GoalsConfigComponent),
        title: 'Metas del equipo',
      },
      {
        path: 'commissions',
        loadComponent: () =>
          import('./pages/commissions-report/commissions-report.component').then(m => m.CommissionsReportComponent),
        title: 'Reporte de comisiones',
      },
    ],
  },
];
