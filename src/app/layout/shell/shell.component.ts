import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService }      from '../../core/services/auth.service';
import { WorkshopService }  from '../../features/workshop/services/workshop.service';
import { StoreOrdersService } from '../../features/store-orders/store-orders.service';
import { ACTIVE_STATUSES }  from '../../features/workshop/models/workshop.model';

interface NavItem {
  label: string;
  svg:   SafeHtml;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private auth           = inject(AuthService);
  private router         = inject(Router);
  private sanitizer      = inject(DomSanitizer);
  private workshopSvc    = inject(WorkshopService);
  private storeOrdersSvc = inject(StoreOrdersService);

  currentUser = this.auth.currentUser;
  menuOpen    = signal(false);

  // ── Nav badges ────────────────────────────────────────────────────
  workshopBadge    = signal(0);
  storeOrdersBadge = signal(0);

  userInitials = computed(() => {
    const email = this.currentUser()?.email ?? '';
    return email.slice(0, 2).toUpperCase();
  });

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      svg: this.svg(`<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`)
    },
    {
      label: 'Personal',
      route: '/staff',
      svg: this.svg(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`)
    },
    {
      label: 'Inventario',
      route: '/inventory',
      svg: this.svg(`<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`)
    },
    {
      label: 'CRM',
      route: '/crm',
      svg: this.svg(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><line x1="19" y1="8" x2="23" y2="8"/>`)
    },
    {
      label: 'Ventas',
      route: '/sales',
      svg: this.svg(`<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`)
    },
    {
      label: 'Facturación',
      route: '/billing',
      svg: this.svg(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`)
    },
    {
      label: 'Crédito',
      route: '/credit',
      svg: this.svg(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/>`)
    },
    {
      label: 'Cobranza',
      route: '/collection',
      svg: this.svg(`<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`)
    },
    {
      label: 'WhatsApp',
      route: '/whatsapp',
      svg: this.svg(`<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>`)
    },
    {
      label: 'Contabilidad',
      route: '/accounting',
      svg: this.svg(`<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`)
    },
    {
      label: 'Planilla',
      route: '/payroll',
      svg: this.svg(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>`)
    },
    {
      label: 'Analytics',
      route: '/analytics',
      svg: this.svg(`<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`)
    },
    {
      label: 'Taller',
      route: '/workshop',
      svg: this.svg(`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`)
    },
    {
      label: 'Pedidos Web',
      route: '/store-orders',
      svg: this.svg(`<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>`)
    },
    {
      label: 'Configuración',
      route: '/settings',
      svg: this.svg(`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`)
    },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      workshop:    this.workshopSvc.getAll().pipe(catchError(() => of([]))),
      storeOrders: this.storeOrdersSvc.getAll().pipe(catchError(() => of([]))),
    }).subscribe(({ workshop, storeOrders }) => {
      this.workshopBadge.set(
        workshop.filter(o => ACTIVE_STATUSES.includes(o.status)).length
      );
      this.storeOrdersBadge.set(
        storeOrders.filter(o => o.status === 'PENDIENTE').length
      );
    });
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  logout() {
    this.menuOpen.set(false);
    this.auth.signOut().then(() => this.router.navigate(['/login']));
  }

  private svg(paths: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
    );
  }
}
