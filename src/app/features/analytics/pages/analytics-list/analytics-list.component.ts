import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';
import {
  AGING_CLASS, AnalyticsAlert, AnalyticsKpi, AnalyticsPeriod, AnalyticsTab,
  CollectionAnalytics, CreditAnalytics, CustomerAnalytics, InventoryAnalytics,
  PERIOD_PRESETS, SalesAnalytics, WorkshopAnalytics,
} from '../../models/analytics.model';

type LoadState = 'idle' | 'loading' | 'error' | 'ok';

@Component({
  selector:    'app-analytics-list',
  standalone:  true,
  imports:     [DecimalPipe],
  templateUrl: './analytics-list.component.html',
  styleUrl:    './analytics-list.component.scss',
})
export class AnalyticsListComponent implements OnInit {
  private svc = inject(AnalyticsService);

  // ── Navigation ─────────────────────────────────────────────
  activeTab    = signal<AnalyticsTab>('ventas');
  activePeriod = signal<AnalyticsPeriod>('mes');

  // ── Data & load state ──────────────────────────────────────
  salesState    = signal<LoadState>('idle');
  invState      = signal<LoadState>('idle');
  creditState   = signal<LoadState>('idle');
  custState     = signal<LoadState>('idle');

  salesData    = signal<SalesAnalytics | null>(null);
  invData      = signal<InventoryAnalytics | null>(null);
  creditData   = signal<CreditAnalytics | null>(null);
  custData     = signal<CustomerAnalytics | null>(null);

  collState   = signal<LoadState>('idle');
  collData    = signal<CollectionAnalytics | null>(null);
  collErr     = signal('');

  workshopState = signal<LoadState>('idle');
  workshopData  = signal<WorkshopAnalytics | null>(null);
  workshopErr   = signal('');

  salesErr  = signal('');
  invErr    = signal('');
  creditErr = signal('');
  custErr   = signal('');

  // ── Export feedback ────────────────────────────────────────
  exportSuccess = signal(false);

  // ── Constants ──────────────────────────────────────────────
  readonly PERIOD_PRESETS = PERIOD_PRESETS;
  readonly AGING_CLASS    = AGING_CLASS;

  // ── Computed ───────────────────────────────────────────────
  periodLabel = computed(() =>
    PERIOD_PRESETS.find(p => p.key === this.activePeriod())?.label ?? 'Este mes'
  );

  alerts = computed((): AnalyticsAlert[] => {
    const list: AnalyticsAlert[] = [];
    const inv  = this.invData();
    const cred = this.creditData();
    const sale = this.salesData();

    if (inv) {
      const critical = inv.aging.filter(a => a.bucket === '90+').reduce((s, a) => s + a.unidades, 0);
      if (critical > 0) {
        list.push({ type: 'warn', message: `${critical} motos con 90+ días sin vender`, tab: 'inventario' });
      }
    }
    if (cred && cred.kpis.length >= 4) {
      // kpis[2] = Tasa de aprobación, kpis[3] = Monto desembolsado
      const tasa = cred.kpis[2];
      if (tasa.delta < -5) {
        list.push({ type: 'warn', message: `Tasa de aprobación cayó ${Math.abs(tasa.delta).toFixed(1)} pts vs período anterior`, tab: 'credito' });
      }
      const desembolsado = cred.kpis[3];
      if (desembolsado.value > 50_000) {
        list.push({ type: 'info', message: `S/ ${desembolsado.value.toLocaleString('es-PE')} desembolsados este período`, tab: 'credito' });
      }
    }
    // kpis[1] = Ingresos totales
    if (sale && sale.kpis.length >= 2 && sale.kpis[1].delta < -10) {
      list.push({ type: 'warn', message: `Ingresos cayeron ${Math.abs(sale.kpis[1].delta).toFixed(0)}% vs período anterior`, tab: 'ventas' });
    }
    return list.slice(0, 3);
  });

  salesChartMax = computed(() =>
    Math.max(1, ...(this.salesData()?.monthlyTrend.map(b => b.value) ?? []))
  );
  invChartMax = computed(() =>
    Math.max(1, ...(this.invData()?.byStatus.map(b => b.value) ?? []))
  );
  creditChartMax = computed(() =>
    Math.max(1, ...(this.creditData()?.monthlyTrend.map(b => b.value) ?? []))
  );
  custChartMax = computed(() =>
    Math.max(1, ...(this.custData()?.monthlyTrend.map(b => b.value) ?? []))
  );
  collChartMax = computed(() =>
    Math.max(1, ...(this.collData()?.monthlyTrend.map(b => b.value) ?? []))
  );
  workshopChartMax = computed(() =>
    Math.max(1, ...(this.workshopData()?.monthlyTrend.map(b => b.value) ?? []))
  );

  ngOnInit() { this.loadSales(); }

  // ── Tab & period ───────────────────────────────────────────
  setTab(tab: AnalyticsTab) {
    this.activeTab.set(tab);
    if (!this.dataReady(tab)) this.loadTab(tab);
  }

  setPeriod(p: AnalyticsPeriod) {
    if (this.activePeriod() === p) return;
    this.activePeriod.set(p);
    this.salesData.set(null);    this.invData.set(null);
    this.creditData.set(null);   this.custData.set(null);
    this.collData.set(null);     this.workshopData.set(null);
    this.salesState.set('idle'); this.invState.set('idle');
    this.creditState.set('idle'); this.custState.set('idle');
    this.collState.set('idle');  this.workshopState.set('idle');
    this.loadTab(this.activeTab());
  }

  navigateToAlert(tab: AnalyticsTab) { this.setTab(tab); }

  // ── Public retry methods ───────────────────────────────────
  retrySales()      { this.salesData.set(null); this.loadSales(); }
  retryInv()        { this.invData.set(null); this.loadInventory(); }
  retryCredit()     { this.creditData.set(null); this.loadCredit(); }
  retryCustomers()  { this.custData.set(null); this.loadCustomers(); }
  retryCollection() { this.collData.set(null); this.loadCollection(); }
  retryWorkshop()   { this.workshopData.set(null); this.loadWorkshop(); }

  // ── Helpers ────────────────────────────────────────────────
  barHeightPct(value: number, max: number): number {
    if (max === 0) return 2;
    return Math.max(2, Math.round((value / max) * 100));
  }

  deltaClass(delta: number): string {
    if (delta > 0)  return 'delta--pos';
    if (delta < -5) return 'delta--neg';
    return 'delta--neu';
  }

  deltaSign(delta: number): string { return delta > 0 ? '+' : ''; }

  formatKpi(kpi: AnalyticsKpi): string {
    const n = kpi.value.toLocaleString('es-PE', {
      minimumFractionDigits: kpi.decimals ?? 0,
      maximumFractionDigits: kpi.decimals ?? 0,
    });
    return `${kpi.prefix ?? ''}${n}${kpi.suffix ?? ''}`;
  }

  shortNumber(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'K';
    return v.toFixed(0);
  }

  tasaBarWidth(tasa: number): number {
    return Math.min(100, Math.max(0, tasa));
  }

  eficBarWidth(cerradas: number, total: number): number {
    if (total === 0) return 0;
    return Math.min(100, Math.max(0, Math.round((cerradas / total) * 100)));
  }

  // ── CSV export ─────────────────────────────────────────────
  exportCsv(tab: AnalyticsTab) {
    let rows: string[][] = [];
    let filename = '';

    switch (tab) {
      case 'ventas': {
        const d = this.salesData(); if (!d) return;
        rows = [
          ['Vendedor', 'Unidades', 'Ingresos (S/)', 'Comisión (S/)', 'Conversión (%)'],
          ...d.byVendedor.map(r => [r.vendedor, String(r.unidades), r.ingresos.toFixed(2), r.comision.toFixed(2), r.conversion.toFixed(1)]),
        ];
        filename = `analytics-ventas-${this.activePeriod()}.csv`;
        break;
      }
      case 'inventario': {
        const d = this.invData(); if (!d) return;
        rows = [
          ['Modelo', 'Marca', 'Unidades', 'Días prom.', 'Valor est. (S/)', 'Aging'],
          ...d.aging.map(r => [r.modelo, r.marca, String(r.unidades), String(r.diasPromedio), r.valorEstimado.toFixed(2), r.bucket]),
        ];
        filename = `analytics-inventario-${this.activePeriod()}.csv`;
        break;
      }
      case 'credito': {
        const d = this.creditData(); if (!d) return;
        rows = [
          ['Fintech', 'Solicitudes', 'Aprobadas', 'Tasa (%)', 'Desembolsado (S/)'],
          ...d.byFintech.map(r => [r.fintech, String(r.solicitudes), String(r.aprobadas), r.tasa.toFixed(1), r.desembolsado.toFixed(2)]),
        ];
        filename = `analytics-credito-${this.activePeriod()}.csv`;
        break;
      }
      case 'clientes': {
        const d = this.custData(); if (!d) return;
        rows = [
          ['Canal', 'Leads', 'Clientes', 'Conversión (%)', 'LTV prom. (S/)'],
          ...d.byChannel.map(r => [r.canal, String(r.leads), String(r.clientes), r.conversion.toFixed(1), r.ltv.toFixed(2)]),
        ];
        filename = `analytics-clientes-${this.activePeriod()}.csv`;
        break;
      }
      case 'cobranza': {
        const d = this.collData(); if (!d) return;
        rows = [
          ['Asesor', 'Cuentas a cargo', 'Cuotas vencidas', 'Monto mora (S/)', 'Monto cobrado (S/)', 'Tasa cobranza (%)'],
          ...d.byAdvisor.map(r => [r.asesor, String(r.cuentasACargo), String(r.cuotasVencidas), r.montoMora.toFixed(2), r.montoCobrado.toFixed(2), r.tasaCobranza.toFixed(1)]),
        ];
        filename = `analytics-cobranza-${this.activePeriod()}.csv`;
        break;
      }
      case 'taller': {
        const d = this.workshopData(); if (!d) return;
        rows = [
          ['Técnico', 'OTs totales', 'OTs cerradas', 'Eficiencia (%)', 'Ingresos (S/)', 'Días prom.', 'Horas trabajadas'],
          ...d.byTechnician.map(r => [
            r.tecnico,
            String(r.totalOts),
            String(r.otsCerradas),
            r.totalOts > 0 ? ((r.otsCerradas / r.totalOts) * 100).toFixed(1) : '0.0',
            r.ingresos.toFixed(2),
            String(r.avgDias),
            r.totalHoras.toFixed(1),
          ]),
        ];
        filename = `analytics-taller-${this.activePeriod()}.csv`;
        break;
      }
    }

    const content = '﻿' + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    this.exportSuccess.set(true);
    setTimeout(() => this.exportSuccess.set(false), 2500);
  }

  trackByIdx(i: number) { return i; }

  // ── Private loaders ────────────────────────────────────────
  private dataReady(tab: AnalyticsTab): boolean {
    switch (tab) {
      case 'ventas':     return this.salesData() !== null;
      case 'inventario': return this.invData() !== null;
      case 'credito':    return this.creditData() !== null;
      case 'clientes':   return this.custData() !== null;
      case 'cobranza':   return this.collData() !== null;
      case 'taller':     return this.workshopData() !== null;
    }
  }

  private loadTab(tab: AnalyticsTab) {
    switch (tab) {
      case 'ventas':     this.loadSales(); break;
      case 'inventario': this.loadInventory(); break;
      case 'credito':    this.loadCredit(); break;
      case 'clientes':   this.loadCustomers(); break;
      case 'cobranza':   this.loadCollection(); break;
      case 'taller':     this.loadWorkshop(); break;
    }
  }

  private loadSales() {
    this.salesState.set('loading'); this.salesErr.set('');
    this.svc.getSales(this.activePeriod()).subscribe({
      next:  d => { this.salesData.set(d); this.salesState.set('ok'); },
      error: _ => { this.salesErr.set('No se pudo cargar el análisis de ventas.'); this.salesState.set('error'); },
    });
  }

  private loadInventory() {
    this.invState.set('loading'); this.invErr.set('');
    this.svc.getInventory(this.activePeriod()).subscribe({
      next:  d => { this.invData.set(d); this.invState.set('ok'); },
      error: _ => { this.invErr.set('No se pudo cargar el análisis de inventario.'); this.invState.set('error'); },
    });
  }

  private loadCredit() {
    this.creditState.set('loading'); this.creditErr.set('');
    this.svc.getCredit(this.activePeriod()).subscribe({
      next:  d => { this.creditData.set(d); this.creditState.set('ok'); },
      error: _ => { this.creditErr.set('No se pudo cargar el análisis de crédito.'); this.creditState.set('error'); },
    });
  }

  private loadCustomers() {
    this.custState.set('loading'); this.custErr.set('');
    this.svc.getCustomers(this.activePeriod()).subscribe({
      next:  d => { this.custData.set(d); this.custState.set('ok'); },
      error: _ => { this.custErr.set('No se pudo cargar el análisis de clientes.'); this.custState.set('error'); },
    });
  }

  private loadCollection() {
    this.collState.set('loading'); this.collErr.set('');
    this.svc.getCollection(this.activePeriod()).subscribe({
      next:  d => { this.collData.set(d); this.collState.set('ok'); },
      error: _ => { this.collErr.set('No se pudo cargar el análisis de cobranza.'); this.collState.set('error'); },
    });
  }

  private loadWorkshop() {
    this.workshopState.set('loading'); this.workshopErr.set('');
    this.svc.getWorkshop(this.activePeriod()).subscribe({
      next:  d => { this.workshopData.set(d); this.workshopState.set('ok'); },
      error: _ => { this.workshopErr.set('No se pudo cargar el análisis del taller.'); this.workshopState.set('error'); },
    });
  }
}
