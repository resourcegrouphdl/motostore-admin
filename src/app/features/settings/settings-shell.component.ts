import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="settings-page">
      <header class="settings-header">
        <h1 class="settings-title">Configuración</h1>
      </header>
      <nav class="settings-tabs" aria-label="Secciones de configuración">
        <a class="s-tab" routerLink="warehouses"    routerLinkActive="s-tab--active">Almacenes</a>
        <a class="s-tab" routerLink="profile"      routerLinkActive="s-tab--active">Perfil de tienda</a>
        <a class="s-tab" routerLink="theme"        routerLinkActive="s-tab--active">Apariencia</a>
        <a class="s-tab" routerLink="users-roles"  routerLinkActive="s-tab--active">Usuarios y roles</a>
        <a class="s-tab" routerLink="fintechs"     routerLinkActive="s-tab--active">Fintechs</a>
        <a class="s-tab" routerLink="billing"      routerLinkActive="s-tab--active">Facturación</a>
        <a class="s-tab" routerLink="whatsapp"     routerLinkActive="s-tab--active">WhatsApp</a>
        <a class="s-tab" routerLink="integrations" routerLinkActive="s-tab--active">Integraciones</a>
      </nav>
      <div class="settings-body">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .settings-page   { padding: 28px 32px; max-width: 900px; display: flex; flex-direction: column; gap: 0; }
    .settings-header { margin-bottom: 20px; }
    .settings-title  { font-family: var(--font-display); font-size: 22px; font-weight: 600; letter-spacing: -0.018em; color: var(--ink); margin: 0; }
    .settings-tabs   { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
    .s-tab {
      padding: 9px 16px; font-size: 13.5px; font-weight: 500; color: var(--ink-3);
      text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color 120ms, border-color 120ms;
      &:hover { color: var(--ink-2); }
    }
    .s-tab--active { color: var(--accent-ink); border-bottom-color: var(--accent); font-weight: 600; }
    .settings-body { min-height: 200px; }
  `]
})
export class SettingsShellComponent {}
