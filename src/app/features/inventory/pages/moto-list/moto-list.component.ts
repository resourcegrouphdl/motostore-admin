import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MotoService }      from '../../services/moto.service';
import { WarehouseService } from '../../services/warehouse.service';
import { Warehouse }        from '../../models/warehouse.model';
import {
  ALLOWED_TRANSITIONS,
  AcquisitionMode,
  FILTER_OPTIONS,
  Moto,
  MotoCreateRequest,
  MotoStatus,
  STATUS_COLOR,
  STATUS_LABEL,
} from '../../models/moto.model';

const ACQUISITION_LABELS: Record<AcquisitionMode, string> = {
  DIRECT_PURCHASE: 'Compra directa',
  CONSIGNMENT:     'Consignación',
  FLOOR_PLAN:      'Floor plan',
  DEMO:            'Demo',
  TRADE_IN:        'Trade-in',
  TRANSFER:        'Traslado',
  RETURN:          'Devolución',
};

const ALL_ACQUISITION_MODES: AcquisitionMode[] = [
  'DIRECT_PURCHASE', 'CONSIGNMENT', 'FLOOR_PLAN', 'DEMO', 'TRADE_IN', 'TRANSFER', 'RETURN',
];

@Component({
  selector: 'app-moto-list',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule],
  templateUrl: './moto-list.component.html',
  styleUrl: './moto-list.component.scss',
})
export class MotoListComponent implements OnInit {
  private motoSvc      = inject(MotoService);
  private warehouseSvc = inject(WarehouseService);

  // ── Core state ───────────────────────────────────────────────────
  loading        = signal(true);
  error          = signal('');
  motos          = signal<Moto[]>([]);
  warehouses     = signal<Warehouse[]>([]);
  selectedStatus = signal<MotoStatus | null>(null);

  // ── Detail panel ─────────────────────────────────────────────────
  panelOpen  = signal(false);
  panelMoto  = signal<Moto | null>(null);

  // ── Status change ────────────────────────────────────────────────
  statusChanging  = signal(false);
  statusError     = signal('');

  // ── Transfer form ────────────────────────────────────────────────
  transferOpen        = signal(false);
  transferSubmitting  = signal(false);
  transferError       = signal('');
  transferToWhId      = signal('');
  transferNotes       = signal('');

  // ── Reserve form ─────────────────────────────────────────────────
  reserveOpen       = signal(false);
  reserveSubmitting = signal(false);
  reserveError      = signal('');
  reservedBy        = signal('');
  holdHours         = signal(48);

  // ── Create dialog state ──────────────────────────────────────────
  createOpen       = signal(false);
  createSubmitting = signal(false);
  createError      = signal('');
  createForm: MotoCreateRequest = this.emptyForm();

  // ── Derived ──────────────────────────────────────────────────────
  filteredMotos = computed(() => {
    const status = this.selectedStatus();
    return status ? this.motos().filter(m => m.status === status) : this.motos();
  });

  statsMap = computed(() => {
    const counts: Partial<Record<MotoStatus, number>> = {};
    for (const m of this.motos()) counts[m.status] = (counts[m.status] ?? 0) + 1;
    return counts;
  });

  totalCount = computed(() => this.motos().length);

  allowedStatuses = computed((): MotoStatus[] => {
    const moto = this.panelMoto();
    if (!moto) return [];
    return ALLOWED_TRANSITIONS[moto.status] ?? [];
  });

  otherWarehouses = computed(() => {
    const moto = this.panelMoto();
    if (!moto) return this.warehouses();
    return this.warehouses().filter(w => w.active);
  });

  // ── Exposed constants ────────────────────────────────────────────
  readonly FILTER_OPTIONS        = FILTER_OPTIONS;
  readonly STATUS_LABEL          = STATUS_LABEL;
  readonly STATUS_COLOR          = STATUS_COLOR;
  readonly ACQUISITION_LABELS    = ACQUISITION_LABELS;
  readonly ALL_ACQUISITION_MODES = ALL_ACQUISITION_MODES;
  readonly currentYear           = new Date().getFullYear();

  animIdx(i: number) { return Math.min(i, 7); }

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      motos:      this.motoSvc.getAll(),
      warehouses: this.warehouseSvc.getAll(),
    }).subscribe({
      next:  ({ motos, warehouses }) => {
        this.motos.set(motos);
        this.warehouses.set(warehouses);
        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudo cargar el inventario.'); this.loading.set(false); },
    });
  }

  // ── Filters ──────────────────────────────────────────────────────
  selectFilter(status: MotoStatus | null) { this.selectedStatus.set(status); }

  // ── Detail panel ─────────────────────────────────────────────────
  openDetail(moto: Moto) {
    this.panelMoto.set(moto);
    this.panelOpen.set(true);
    this.statusError.set('');
    this.transferOpen.set(false);
    this.reserveOpen.set(false);
  }

  closePanel() {
    this.panelOpen.set(false);
    setTimeout(() => this.panelMoto.set(null), 300);
  }

  private updateMotoInList(updated: Moto) {
    this.motos.update(list => list.map(m => m.id === updated.id ? updated : m));
    this.panelMoto.set(updated);
  }

  // ── Status change ────────────────────────────────────────────────
  changeStatus(newStatus: MotoStatus) {
    const moto = this.panelMoto();
    if (!moto) return;
    this.statusChanging.set(true);
    this.statusError.set('');
    this.motoSvc.changeStatus(moto.id, newStatus).subscribe({
      next:  updated => { this.updateMotoInList(updated); this.statusChanging.set(false); },
      error: err => {
        this.statusError.set(err?.error?.message ?? 'Error al cambiar estado.');
        this.statusChanging.set(false);
      },
    });
  }

  // ── Reserve ──────────────────────────────────────────────────────
  openReserve() {
    this.reservedBy.set('');
    this.holdHours.set(48);
    this.reserveError.set('');
    this.reserveOpen.set(true);
  }

  submitReserve() {
    const moto = this.panelMoto();
    if (!moto || !this.reservedBy().trim()) return;
    this.reserveSubmitting.set(true);
    this.reserveError.set('');
    this.motoSvc.reserve(moto.id, {
      reservedBy: this.reservedBy().trim(),
      holdHours:  this.holdHours(),
    }).subscribe({
      next:  updated => {
        this.updateMotoInList(updated);
        this.reserveOpen.set(false);
        this.reserveSubmitting.set(false);
      },
      error: err => {
        this.reserveError.set(err?.error?.message ?? 'Error al reservar.');
        this.reserveSubmitting.set(false);
      },
    });
  }

  releaseHold() {
    const moto = this.panelMoto();
    if (!moto) return;
    this.statusChanging.set(true);
    this.motoSvc.releaseHold(moto.id).subscribe({
      next:  updated => { this.updateMotoInList(updated); this.statusChanging.set(false); },
      error: err => {
        this.statusError.set(err?.error?.message ?? 'Error al liberar reserva.');
        this.statusChanging.set(false);
      },
    });
  }

  // ── Transfer ─────────────────────────────────────────────────────
  openTransfer() {
    this.transferToWhId.set('');
    this.transferNotes.set('');
    this.transferError.set('');
    this.transferOpen.set(true);
  }

  submitTransfer() {
    const moto = this.panelMoto();
    if (!moto || !this.transferToWhId()) return;
    this.transferSubmitting.set(true);
    this.transferError.set('');
    this.motoSvc.startTransfer(moto.id, {
      toWarehouseId:    this.transferToWhId(),
      fromWarehouseId:  undefined,
      notes:            this.transferNotes().trim() || undefined,
    }).subscribe({
      next:  updated => {
        this.updateMotoInList(updated);
        this.transferOpen.set(false);
        this.transferSubmitting.set(false);
      },
      error: err => {
        this.transferError.set(err?.error?.message ?? 'Error al iniciar traslado.');
        this.transferSubmitting.set(false);
      },
    });
  }

  confirmTransfer() {
    const moto = this.panelMoto();
    if (!moto) return;
    this.statusChanging.set(true);
    this.motoSvc.confirmTransfer(moto.id).subscribe({
      next:  updated => { this.updateMotoInList(updated); this.statusChanging.set(false); },
      error: err => {
        this.statusError.set(err?.error?.message ?? 'Error al confirmar traslado.');
        this.statusChanging.set(false);
      },
    });
  }

  // ── Create ───────────────────────────────────────────────────────
  private emptyForm(): MotoCreateRequest {
    return {
      vin: '', brand: '', model: '',
      year: this.currentYear,
      color: '', acquisitionMode: 'DIRECT_PURCHASE', notes: '',
    };
  }

  openCreate() {
    this.createForm = this.emptyForm();
    this.createError.set('');
    this.createOpen.set(true);
  }

  closeCreate() { this.createOpen.set(false); }

  submitCreate() {
    this.createError.set('');
    this.createSubmitting.set(true);
    const payload: MotoCreateRequest = {
      ...this.createForm,
      vin:          this.createForm.vin.trim().toUpperCase(),
      brand:        this.createForm.brand.trim(),
      model:        this.createForm.model.trim(),
      color:        this.createForm.color?.trim() || undefined,
      listPrice:    this.createForm.listPrice    ? +this.createForm.listPrice    : undefined,
      minimumPrice: this.createForm.minimumPrice ? +this.createForm.minimumPrice : undefined,
      notes:        this.createForm.notes?.trim() || undefined,
    };
    this.motoSvc.create(payload).subscribe({
      next: newMoto => {
        this.motos.update(list => [newMoto, ...list]);
        this.createSubmitting.set(false);
        this.closeCreate();
      },
      error: err => {
        this.createError.set(err?.error?.message ?? err?.statusText ?? 'Error al registrar la moto.');
        this.createSubmitting.set(false);
      },
    });
  }
}
