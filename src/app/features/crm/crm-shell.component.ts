import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-crm-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="crm-page">
      <header class="crm-header">
        <h1 class="crm-title">CRM</h1>
      </header>
      <nav class="crm-tabs" aria-label="Vistas del CRM">
        <a class="c-tab" routerLink="customers"    routerLinkActive="c-tab--active">Clientes</a>
        <a class="c-tab" routerLink="pipeline"    routerLinkActive="c-tab--active">Pipeline</a>
        <a class="c-tab" routerLink="leads"       routerLinkActive="c-tab--active">Leads</a>
        <a class="c-tab" routerLink="team-ranking"  routerLinkActive="c-tab--active">Equipo</a>
        <a class="c-tab" routerLink="my-portfolio"  routerLinkActive="c-tab--active">Mi portafolio</a>
        <a class="c-tab" routerLink="goals-config"  routerLinkActive="c-tab--active">Metas</a>
        <a class="c-tab" routerLink="commissions"   routerLinkActive="c-tab--active">Comisiones</a>
      </nav>
      <div class="crm-body"><router-outlet /></div>
    </div>
  `,
  styles: [`
    .crm-page   { padding: 28px 32px; max-width: 1200px; display: flex; flex-direction: column; }
    .crm-header { margin-bottom: 20px; }
    .crm-title  { font-family: var(--font-display); font-size: 22px; font-weight: 600; letter-spacing: -0.018em; color: var(--ink); margin: 0; }
    .crm-tabs   { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
    .c-tab {
      padding: 9px 16px; font-size: 13.5px; font-weight: 500; color: var(--ink-3);
      text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color 120ms, border-color 120ms;
      &:hover { color: var(--ink-2); }
    }
    .c-tab--active { color: var(--accent-ink); border-bottom-color: var(--accent); font-weight: 600; }
    .crm-body { min-height: 300px; }
  `]
})
export class CrmShellComponent {}
