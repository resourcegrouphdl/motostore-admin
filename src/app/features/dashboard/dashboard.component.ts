import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MotoService }        from '../inventory/services/moto.service';
import { StaffService }       from '../staff/services/staff.service';
import { RepuestoService }    from '../inventory/services/repuesto.service';
import { CreditAdminService } from '../credit/services/credit.service';
import { AnalyticsService }   from '../analytics/services/analytics.service';
import { CollectionService }  from '../collection/services/collection.service';
import { WorkshopService }    from '../workshop/services/workshop.service';
import { StoreOrdersService } from '../store-orders/store-orders.service';

import { Moto, MotoStatus, STATUS_LABEL, STATUS_COLOR } from '../inventory/models/moto.model';
import { StaffMember }        from '../staff/models/staff.model';
import { CreditApplication }  from '../credit/models/credit.model';
import { SalesAnalytics, AnalyticsBar } from '../analytics/models/analytics.model';
import { OverdueAccount }     from '../collection/models/collection.model';
import { WorkOrder, ACTIVE_STATUSES } from '../workshop/models/workshop.model';
import { StoreOrder }         from '../store-orders/store-orders.model';

interface KpiCard {
  label:  string;
  value:  string | number;
  sub:    string;
  color:  'accent' | 'success' | 'warning' | 'danger' | 'muted';
  route:  string;
  delta?: number;
}

interface StatusRow {
  status: MotoStatus;
  label:  string;
  count:  number;
  color:  string;
  pct:    number;
}

interface DashAlert {
  type:    'warn' | 'danger' | 'info';
  message: string;
  route:   string;
}

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {

  private motoSvc        = inject(MotoService);
  private staffSvc       = inject(StaffService);
  private repuestoSvc    = inject(RepuestoService);
  private creditSvc      = inject(CreditAdminService);
  private analyticsSvc   = inject(AnalyticsService);
  private collectionSvc  = inject(CollectionService);
  private workshopSvc    = inject(WorkshopService);
  private storeOrdersSvc = inject(StoreOrdersService);

  // ── State ────────────────────────────────────────────────────────────
  loading = signal(true);
  error   = signal('');

  motos           = signal<Moto[]>([]);
  staff           = signal<StaffMember[]>([]);
  credits         = signal<CreditApplication[]>([]);
  lowStockCount   = signal(0);
  salesAnalytics  = signal<SalesAnalytics | null>(null);
  overdueAccounts = signal<OverdueAccount[]>([]);
  workOrders      = signal<WorkOrder[]>([]);
  storeOrders     = signal<StoreOrder[]>([]);

  // ── Credit computeds ──────────────────────────────────────────────────
  creditosActivos = computed(() =>
    this.credits().filter(c =>
      c.status === 'SUBMITTED' || c.status === 'IN_REVIEW' ||
      c.status === 'CONDITIONAL' || c.status === 'APPROVED'
    )
  );

  creditosPendientes = computed(() =>
    this.credits().filter(c => c.status === 'SUBMITTED' || c.status === 'IN_REVIEW')
  );

  // ── Workshop computeds ────────────────────────────────────────────────
  otActivasCount = computed(() =>
    this.workOrders().filter(o => ACTIVE_STATUSES.includes(o.status)).length
  );

  otListaCount = computed(() =>
    this.workOrders().filter(o => o.status === 'LISTA').length
  );

  // ── Store orders computeds ────────────────────────────────────────────
  storeOrdersPending = computed(() =>
    this.storeOrders().filter(o => o.status === 'PENDIENTE').length
  );

  storeOrdersPrep = computed(() =>
    this.storeOrders().filter(o => o.status === 'EN_PREPARACION').length
  );

  // ── KPI cards ─────────────────────────────────────────────────────────
  kpis = computed<KpiCard[]>(() => {
    const analytics  = this.salesAnalytics();
    const motos      = this.motos();
    const overdue    = this.overdueAccounts();
    const pendientes = this.creditosPendientes().length;
    const activos    = this.creditosActivos().length;
    const otActivas  = this.otActivasCount();
    const otLista    = this.otListaCount();
    const pedidos    = this.storeOrdersPending();
    const enPrep     = this.storeOrdersPrep();

    const disponibles  = motos.filter(m => m.status === 'IN_WAREHOUSE' || m.status === 'ON_DISPLAY').length;
    const ingMes       = analytics ? Number(analytics.kpis[1]?.value  ?? 0) : 0;
    const ingDelta     = analytics ? (analytics.kpis[1]?.delta         ?? 0) : 0;
    const vtaMes       = analytics ? Number(analytics.kpis[0]?.value  ?? 0) : 0;
    const overdueCount = overdue.length;
    const overdueSoles = overdue.reduce((s, o) => s + o.totalOverdueSoles, 0);

    return [
      {
        label: 'Disponibles',
        value: disponibles,
        sub:   'motos en stock',
        color: 'accent',
        route: '/inventory/motos',
      },
      {
        label: 'Ingresos del mes',
        value: ingMes > 0 ? this.moneyShort(ingMes) : '—',
        sub:   vtaMes > 0
                 ? `${vtaMes} venta${vtaMes > 1 ? 's' : ''} concretada${vtaMes > 1 ? 's' : ''}`
                 : 'sin ventas este mes',
        color: vtaMes > 0 ? 'success' : 'muted',
        route: '/sales',
        delta: ingDelta,
      },
      {
        label: 'Créditos activos',
        value: activos,
        sub:   pendientes > 0
                 ? `${pendientes} pendiente${pendientes > 1 ? 's' : ''} de revisión`
                 : 'todos al día',
        color: pendientes > 0 ? 'warning' : 'muted',
        route: '/credit',
      },
      {
        label: 'Cobranza',
        value: overdueCount,
        sub:   overdueCount > 0
                 ? `S/ ${overdueSoles.toLocaleString('es-PE', { maximumFractionDigits: 0 })} en mora`
                 : 'sin cuentas vencidas',
        color: overdueCount > 0 ? 'danger' : 'muted',
        route: '/collection',
      },
      {
        label: 'Taller',
        value: otActivas,
        sub:   otLista > 0
                 ? `${otLista} lista${otLista > 1 ? 's' : ''} para entrega`
                 : 'sin OTs pendientes',
        color: otLista > 0 ? 'warning' : otActivas > 0 ? 'accent' : 'muted',
        route: '/workshop',
      },
      {
        label: 'Pedidos Web',
        value: pedidos,
        sub:   pedidos > 0
                 ? `${enPrep} en preparación`
                 : 'sin pedidos pendientes',
        color: pedidos > 0 ? 'warning' : 'muted',
        route: '/store-orders',
      },
    ];
  });

  // ── Dashboard alerts ──────────────────────────────────────────────────
  dashAlerts = computed<DashAlert[]>(() => {
    const list: DashAlert[] = [];
    const overdue    = this.overdueAccounts();
    const stock      = this.lowStockCount();
    const pendientes = this.creditosPendientes().length;
    const otLista    = this.otListaCount();
    const pedidos    = this.storeOrdersPending();

    if (overdue.length > 0) {
      const total = overdue.reduce((s, o) => s + o.totalOverdueSoles, 0);
      list.push({
        type: 'danger',
        message: `${overdue.length} cuenta${overdue.length > 1 ? 's' : ''} en mora — S/ ${total.toLocaleString('es-PE', { maximumFractionDigits: 0 })} vencidos`,
        route: '/collection',
      });
    }
    if (otLista > 0) {
      list.push({
        type: 'warn',
        message: `${otLista} OT${otLista > 1 ? 's' : ''} lista${otLista > 1 ? 's' : ''} para entrega — cliente esperando`,
        route: '/workshop',
      });
    }
    if (pedidos > 0) {
      list.push({
        type: 'info',
        message: `${pedidos} pedido${pedidos > 1 ? 's' : ''} web pendiente${pedidos > 1 ? 's' : ''} de confirmación`,
        route: '/store-orders',
      });
    }
    if (stock > 0) {
      list.push({
        type: 'warn',
        message: `${stock} repuesto${stock > 1 ? 's' : ''} bajo el stock mínimo`,
        route: '/inventory/repuestos',
      });
    }
    if (pendientes > 0) {
      list.push({
        type: 'warn',
        message: `${pendientes} solicitud${pendientes > 1 ? 'es' : ''} de crédito pendiente${pendientes > 1 ? 's' : ''} de revisión`,
        route: '/credit',
      });
    }
    return list.slice(0, 4);
  });

  // ── Mini trend chart (últimos 6 meses) ───────────────────────────────
  miniChartBars = computed<AnalyticsBar[]>(() =>
    (this.salesAnalytics()?.monthlyTrend ?? []).slice(-6)
  );

  miniChartMax = computed(() =>
    Math.max(1, ...this.miniChartBars().map(b => Number(b.value)))
  );

  // ── Inventory breakdown ───────────────────────────────────────────────
  statusRows = computed<StatusRow[]>(() => {
    const motos  = this.motos();
    const counts: Partial<Record<MotoStatus, number>> = {};
    for (const m of motos) counts[m.status] = (counts[m.status] ?? 0) + 1;

    const statuses: MotoStatus[] = [
      'IN_WAREHOUSE', 'ON_DISPLAY', 'RESERVED',
      'IN_CREDIT_EVALUATION', 'IN_TRANSIT', 'SOLD', 'DEMO', 'TRADE_IN',
    ];
    const maxCount = Math.max(...statuses.map(s => counts[s] ?? 0), 1);

    return statuses
      .map(s => ({
        status: s,
        label:  STATUS_LABEL[s],
        count:  counts[s] ?? 0,
        color:  STATUS_COLOR[s],
        pct:    Math.round(((counts[s] ?? 0) / maxCount) * 100),
      }))
      .filter(r => r.count > 0 || statuses.indexOf(r.status) < 4);
  });

  totalMotos      = computed(() => this.motos().length);
  totalStaff      = computed(() => this.staff().filter((s: StaffMember) => s.isActive).length);
  valorInventario = computed(() =>
    this.motos()
      .filter(m => m.status === 'IN_WAREHOUSE' || m.status === 'ON_DISPLAY')
      .reduce((sum, m) => sum + (m.listPrice ?? 0), 0)
  );

  today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      motos:       this.motoSvc.getAll().pipe(catchError(() => of([]))),
      staff:       this.staffSvc.getAll().pipe(catchError(() => of([]))),
      lowStock:    this.repuestoSvc.getLowStock().pipe(catchError(() => of([]))),
      credits:     this.creditSvc.getAll().pipe(catchError(() => of([]))),
      analytics:   this.analyticsSvc.getSales('mes').pipe(catchError(() => of(null))),
      overdue:     this.collectionSvc.getOverdueAccounts().pipe(catchError(() => of([]))),
      workshop:    this.workshopSvc.getAll().pipe(catchError(() => of([]))),
      storeOrders: this.storeOrdersSvc.getAll().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ motos, staff, lowStock, credits, analytics, overdue, workshop, storeOrders }) => {
        this.motos.set(motos);
        this.staff.set(staff);
        this.lowStockCount.set(lowStock.length);
        this.credits.set(credits);
        this.salesAnalytics.set(analytics);
        this.overdueAccounts.set(overdue);
        this.workOrders.set(workshop);
        this.storeOrders.set(storeOrders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
        this.loading.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  deltaClass(delta: number): string {
    if (delta > 0)  return 'kpi-delta--pos';
    if (delta < -5) return 'kpi-delta--neg';
    return 'kpi-delta--neu';
  }

  deltaSign(delta: number): string { return delta > 0 ? '+' : ''; }

  barHeightPct(value: number, max: number): number {
    return Math.max(2, Math.round((value / max) * 100));
  }

  shortNumber(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'K';
    return v.toFixed(0);
  }

  moneyShort(n: number): string {
    if (n >= 1_000_000) return `S/${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `S/${(n / 1_000).toFixed(0)}K`;
    return `S/${n.toFixed(0)}`;
  }

  animIdx(i: number) { return Math.min(i, 7); }
  trackByIdx(i: number) { return i; }
}
