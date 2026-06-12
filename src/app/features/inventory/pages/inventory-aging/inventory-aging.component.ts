import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MotoService } from '../../services/moto.service';
import {
  Moto, MotoStatus, STATUS_LABEL, STATUS_COLOR,
  AcquisitionMode,
} from '../../models/moto.model';

export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';

export interface AgingRow {
  moto:    Moto;
  days:    number;
  bucket:  AgingBucket;
}

const ACQUISITION_LABEL: Record<AcquisitionMode, string> = {
  DIRECT_PURCHASE: 'Compra',
  CONSIGNMENT:     'Consignación',
  FLOOR_PLAN:      'Floor plan',
  DEMO:            'Demo',
  TRADE_IN:        'Trade-in',
  TRANSFER:        'Traslado',
  RETURN:          'Devolución',
};

const EXCLUDE_STATUSES = new Set<MotoStatus>(['SOLD']);

type SortField = 'days' | 'brand' | 'status';
type SortDir   = 'asc' | 'desc';

function agingBucket(days: number): AgingBucket {
  if (days <= 30)  return '0-30';
  if (days <= 60)  return '31-60';
  if (days <= 90)  return '61-90';
  return '90+';
}

function daysInInventory(moto: Moto): number {
  const now   = Date.now();
  const added = new Date(moto.createdAt).getTime();
  return Math.floor((now - added) / 86_400_000);
}

@Component({
  selector: 'app-inventory-aging',
  standalone: true,
  imports: [],
  templateUrl: './inventory-aging.component.html',
  styleUrl: './inventory-aging.component.scss',
})
export class InventoryAgingComponent implements OnInit {
  private motoSvc = inject(MotoService);

  loading = signal(true);
  error   = signal('');
  rows    = signal<AgingRow[]>([]);

  selectedBucket = signal<AgingBucket | null>(null);
  sortField      = signal<SortField>('days');
  sortDir        = signal<SortDir>('desc');

  // ── KPIs ─────────────────────────────────────────────────────────
  bucketCounts = computed(() => {
    const r = this.rows();
    return {
      '0-30':  r.filter(x => x.bucket === '0-30').length,
      '31-60': r.filter(x => x.bucket === '31-60').length,
      '61-90': r.filter(x => x.bucket === '61-90').length,
      '90+':   r.filter(x => x.bucket === '90+').length,
    };
  });

  avgDays = computed(() => {
    const r = this.rows();
    if (!r.length) return 0;
    return Math.round(r.reduce((s, x) => s + x.days, 0) / r.length);
  });

  maxDays = computed(() => {
    const r = this.rows();
    return r.length ? Math.max(...r.map(x => x.days)) : 0;
  });

  // ── Filtered + sorted ─────────────────────────────────────────────
  filtered = computed(() => {
    const bucket = this.selectedBucket();
    const rows   = bucket ? this.rows().filter(r => r.bucket === bucket) : this.rows();

    const field = this.sortField();
    const dir   = this.sortDir() === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      if (field === 'days')   return dir * (a.days - b.days);
      if (field === 'brand')  return dir * `${a.moto.brand} ${a.moto.model}`.localeCompare(`${b.moto.brand} ${b.moto.model}`);
      if (field === 'status') return dir * a.moto.status.localeCompare(b.moto.status);
      return 0;
    });
  });

  // ── Exposed constants ─────────────────────────────────────────────
  readonly BUCKETS: AgingBucket[]        = ['0-30', '31-60', '61-90', '90+'];
  readonly BUCKET_LABEL: Record<AgingBucket, string> = {
    '0-30':  '0 – 30 días',
    '31-60': '31 – 60 días',
    '61-90': '61 – 90 días',
    '90+':   'Más de 90 días',
  };
  readonly STATUS_LABEL          = STATUS_LABEL;
  readonly STATUS_COLOR          = STATUS_COLOR;
  readonly ACQUISITION_LABEL     = ACQUISITION_LABEL;

  animIdx(i: number) { return Math.min(i, 7); }

  bucketClass(bucket: AgingBucket): string {
    if (bucket === '90+')   return 'danger';
    if (bucket === '61-90') return 'warn';
    if (bucket === '31-60') return 'info';
    return 'ok';
  }

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit() {
    this.motoSvc.getAll().subscribe({
      next: motos => {
        const agingRows = motos
          .filter(m => !EXCLUDE_STATUSES.has(m.status))
          .map(m => {
            const days = daysInInventory(m);
            return { moto: m, days, bucket: agingBucket(days) } as AgingRow;
          });
        this.rows.set(agingRows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el reporte de antigüedad.');
        this.loading.set(false);
      },
    });
  }

  // ── Interactions ──────────────────────────────────────────────────
  selectBucket(bucket: AgingBucket | null) { this.selectedBucket.set(bucket); }

  sort(field: SortField) {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return 'unsorted';
    return this.sortDir() === 'asc' ? 'asc' : 'desc';
  }
}
