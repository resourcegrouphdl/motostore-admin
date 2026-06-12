import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { StoreOrdersService } from './store-orders.service';
import { ExportService }      from '../../core/services/export.service';
import {
  StoreOrder, StoreOrderStatus,
  STATUS_LABEL, STATUS_NEXT,
} from './store-orders.model';

type KpiGroup = 'TODOS' | 'PENDIENTE' | 'EN_PROCESO' | 'ENTREGADA';
type SubFilter = StoreOrderStatus | null;

const EN_PROCESO_STATUSES: StoreOrderStatus[] = ['CONFIRMADA', 'EN_PREPARACION', 'LISTO_RECOJO'];

export const STEPPER_STEPS: StoreOrderStatus[] = [
  'PENDIENTE', 'CONFIRMADA', 'EN_PREPARACION', 'LISTO_RECOJO', 'ENTREGADA',
];

@Component({
  selector: 'app-store-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './store-orders.component.html',
  styleUrl: './store-orders.component.scss',
})
export class StoreOrdersComponent implements OnInit {
  private svc    = inject(StoreOrdersService);
  private export = inject(ExportService);

  loading      = signal(true);
  error        = signal('');
  orders       = signal<StoreOrder[]>([]);
  selected     = signal<StoreOrder | null>(null);
  panelVisible = signal(false);
  itemsLoading = signal(false);
  exporting     = signal(false);
  updating      = signal(false);
  confirming    = signal(false);
  toast         = signal('');
  toastWa       = signal(false);
  lastNotifSent = signal<boolean | null>(null);

  kpiFilter = signal<KpiGroup>('TODOS');
  subFilter = signal<SubFilter>(null);

  filtered = computed(() => {
    const kpi = this.kpiFilter();
    const sub = this.subFilter();
    const all = this.orders();

    if (kpi === 'TODOS')       return all;
    if (kpi === 'PENDIENTE')   return all.filter(o => o.status === 'PENDIENTE');
    if (kpi === 'ENTREGADA')   return all.filter(o => o.status === 'ENTREGADA');
    if (kpi === 'EN_PROCESO') {
      const base = all.filter(o => EN_PROCESO_STATUSES.includes(o.status));
      return sub ? base.filter(o => o.status === sub) : base;
    }
    return all;
  });

  showSubFilters = computed(() => this.kpiFilter() === 'EN_PROCESO');

  kpiTotal    = computed(() => this.orders().length);
  kpiPending  = computed(() => this.orders().filter(o => o.status === 'PENDIENTE').length);
  kpiActive   = computed(() => this.orders().filter(o => EN_PROCESO_STATUSES.includes(o.status)).length);
  kpiDone     = computed(() => this.orders().filter(o => o.status === 'ENTREGADA').length);

  stepperSteps  = STEPPER_STEPS;
  statusLabel   = STATUS_LABEL;
  statusNext    = STATUS_NEXT;
  subFilterOpts = EN_PROCESO_STATUSES;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: data => { this.orders.set(data); this.loading.set(false); },
      error: _   => { this.error.set('Error al cargar pedidos'); this.loading.set(false); },
    });
  }

  selectKpi(kpi: KpiGroup) {
    this.kpiFilter.set(kpi);
    this.subFilter.set(null);
  }

  selectOrder(order: StoreOrder) {
    this.confirming.set(false);
    this.lastNotifSent.set(null);
    this.selected.set(order);
    this.panelVisible.set(true);
    this.itemsLoading.set(true);
    this.svc.getById(order.id).subscribe({
      next: detail => { this.selected.set(detail); this.itemsLoading.set(false); },
      error: _     => { this.itemsLoading.set(false); },
    });
  }

  closePanel() {
    this.panelVisible.set(false);
    // let exit transition play before clearing content
    setTimeout(() => this.selected.set(null), 280);
  }

  advance(order: StoreOrder) {
    const next = STATUS_NEXT[order.status];
    if (!next) return;
    this.updating.set(true);
    this.svc.updateStatus(order.id, next.status).subscribe({
      next: updated => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.selected.set(updated);
        this.lastNotifSent.set(updated.notificationSent ?? null);
        this.updating.set(false);
        this.showToast(
          `${updated.numeroOrden} → ${STATUS_LABEL[updated.status]}`,
          updated.notificationSent === true,
        );
      },
      error: _ => { this.updating.set(false); this.showToast('Error al actualizar estado'); },
    });
  }

  requestCancel() {
    this.confirming.set(true);
  }

  abortCancel() {
    this.confirming.set(false);
  }

  confirmCancel(order: StoreOrder) {
    this.confirming.set(false);
    this.updating.set(true);
    this.svc.updateStatus(order.id, 'CANCELADA').subscribe({
      next: updated => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.selected.set(updated);
        this.lastNotifSent.set(null);
        this.updating.set(false);
        this.showToast(`Pedido ${updated.numeroOrden} cancelado`);
      },
      error: _ => { this.updating.set(false); this.showToast('Error al cancelar'); },
    });
  }

  canCancel(order: StoreOrder) {
    return !['ENTREGADA', 'CANCELADA'].includes(order.status);
  }

  stepState(step: StoreOrderStatus, currentStatus: StoreOrderStatus): 'done' | 'active' | 'pending' {
    const stepIdx    = STEPPER_STEPS.indexOf(step);
    const currentIdx = STEPPER_STEPS.indexOf(currentStatus);
    if (currentStatus === 'CANCELADA') return stepIdx === 0 ? 'done' : 'pending';
    if (stepIdx < currentIdx)  return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  }

  private showToast(msg: string, waNotified = false) {
    this.toast.set(msg);
    this.toastWa.set(waNotified);
    setTimeout(() => { this.toast.set(''); this.toastWa.set(false); }, 4000);
  }

  exportCsv() {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.export.download('store-orders/export', 'pedidos-web.csv')
      .subscribe({ next: () => this.exporting.set(false), error: () => this.exporting.set(false) });
  }

  trackById(_: number, o: StoreOrder) { return o.id; }
}
