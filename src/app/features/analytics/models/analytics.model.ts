export type AnalyticsTab    = 'ventas' | 'inventario' | 'credito' | 'clientes' | 'cobranza' | 'taller';
export type AnalyticsPeriod = 'mes' | '3meses' | '6meses' | 'anio';

export interface AnalyticsKpi {
  label:     string;
  value:     number;
  prefix?:   string;
  suffix?:   string;
  delta:     number;
  decimals?: number;
}

export interface AnalyticsBar {
  label: string;
  value: number;
}

export interface AnalyticsAlert {
  type:    'warn' | 'danger' | 'info';
  message: string;
  tab:     AnalyticsTab;
}

// ── Ventas ───────────────────────────────────────────────────
export interface SalesVendedor {
  vendedor:   string;
  unidades:   number;
  ingresos:   number;
  comision:   number;
  conversion: number;
}

export interface SalesAnalytics {
  kpis:            AnalyticsKpi[];
  monthlyTrend:    AnalyticsBar[];
  byVendedor:      SalesVendedor[];
  projectedTotal:  number;
}

// ── Inventario ───────────────────────────────────────────────
export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';

export interface InventoryAging {
  modelo:        string;
  marca:         string;
  unidades:      number;
  diasPromedio:  number;
  valorEstimado: number;
  bucket:        AgingBucket;
}

export interface InventoryAnalytics {
  kpis:     AnalyticsKpi[];
  byStatus: AnalyticsBar[];
  aging:    InventoryAging[];
}

// ── Crédito ──────────────────────────────────────────────────
export interface CreditByFintech {
  fintech:      string;
  solicitudes:  number;
  aprobadas:    number;
  tasa:         number;
  desembolsado: number;
}

export interface CreditAnalytics {
  kpis:         AnalyticsKpi[];
  monthlyTrend: AnalyticsBar[];
  byFintech:    CreditByFintech[];
}

// ── Clientes ─────────────────────────────────────────────────
export interface CustomerByChannel {
  canal:      string;
  leads:      number;
  clientes:   number;
  conversion: number;
  ltv:        number;
}

export interface CustomerAnalytics {
  kpis:         AnalyticsKpi[];
  monthlyTrend: AnalyticsBar[];
  byChannel:    CustomerByChannel[];
}

// ── Cobranza ─────────────────────────────────────────────────
export interface CollectionAdvisor {
  asesor:         string;
  cuentasACargo:  number;
  cuotasVencidas: number;
  montoMora:      number;
  montoCobrado:   number;
  tasaCobranza:   number;
}

export interface CollectionAnalytics {
  kpis:         AnalyticsKpi[];
  monthlyTrend: AnalyticsBar[];
  byAdvisor:    CollectionAdvisor[];
}

// ── Taller ───────────────────────────────────────────────────
export interface WorkshopTechnician {
  tecnico:     string;
  totalOts:    number;
  otsCerradas: number;
  ingresos:    number;
  avgDias:     number;
  totalHoras:  number;
}

export interface WorkshopAnalytics {
  kpis:         AnalyticsKpi[];
  monthlyTrend: AnalyticsBar[];
  byTechnician: WorkshopTechnician[];
}

// ── Constants ────────────────────────────────────────────────
export const PERIOD_PRESETS: { key: AnalyticsPeriod; label: string }[] = [
  { key: 'mes',    label: 'Este mes' },
  { key: '3meses', label: 'Últ. 3 meses' },
  { key: '6meses', label: 'Últ. 6 meses' },
  { key: 'anio',   label: 'Este año' },
];

export const AGING_CLASS: Record<AgingBucket, string> = {
  '0-30':  'ag--ok',
  '31-60': 'ag--warn',
  '61-90': 'ag--alert',
  '90+':   'ag--crit',
};
