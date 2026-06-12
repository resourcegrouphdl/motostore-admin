import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-inventory-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="inv-shell">
      <nav class="inv-tabs" aria-label="Secciones de inventario">
        <a class="inv-tab" routerLink="motos"     routerLinkActive="inv-tab--active">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/>
            <path d="M8 17.5h7M2 12l2-7h10l2 4h3l2 3-3 1"/>
          </svg>
          Motos
        </a>
        <a class="inv-tab" routerLink="repuestos"  routerLinkActive="inv-tab--active">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          Repuestos
        </a>
        <a class="inv-tab" routerLink="alerts" routerLinkActive="inv-tab--active">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Alertas stock
        </a>
        <a class="inv-tab" routerLink="aging" routerLinkActive="inv-tab--active">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Antigüedad
        </a>
        <a class="inv-tab" routerLink="purchase-orders" routerLinkActive="inv-tab--active">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Órdenes de compra
        </a>
      </nav>
      <router-outlet />
    </div>
  `,
  styles: [`
    .inv-shell { display: flex; flex-direction: column; height: 100%; }

    .inv-tabs {
      display: flex;
      gap: 2px;
      padding: 12px 32px 0;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }

    .inv-tab {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 14px 10px;
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 500;
      color: var(--ink-3);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 120ms ease;
      white-space: nowrap;
      border-radius: var(--r-xs) var(--r-xs) 0 0;

      &:hover { color: var(--ink-1); }
      &:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: var(--r-xs); }

      &--active {
        color: var(--ink);
        border-bottom-color: var(--ink);
        font-weight: 600;
      }

      svg { opacity: 0.7; }
      &--active svg { opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .inv-tab { transition: none; }
    }
  `],
})
export class InventoryShellComponent {}
