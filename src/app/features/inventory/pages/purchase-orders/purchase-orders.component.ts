import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { PurchaseOrderService } from '../../services/purchase-order.service';
import { RepuestoService }      from '../../services/repuesto.service';
import { WarehouseService }     from '../../services/warehouse.service';
import {
  PurchaseOrder, PurchaseOrderStatus, PurchaseOrderCreateRequest,
  ReceiveStockRequest, STATUS_COLOR, STATUS_FILTERS, STATUS_LABEL,
} from '../../models/purchase-order.model';
import { Repuesto } from '../../models/repuesto.model';
import { Warehouse } from '../../models/warehouse.model';

interface CreateItem {
  repuestoId: string;
  quantityOrdered: number;
  unitCost?: number;
}

interface ReceiptRow {
  itemId:           string;
  repuestoId:       string;
  repuestoName:     string;
  quantityOrdered:  number;
  quantityReceived: number;
  quantityPending:  number;
  inputQty:         number;
}

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule],
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.scss',
})
export class PurchaseOrdersComponent implements OnInit {
  private poSvc        = inject(PurchaseOrderService);
  private repuestoSvc  = inject(RepuestoService);
  private warehouseSvc = inject(WarehouseService);

  private createDialogEl  = viewChild<ElementRef<HTMLDialogElement>>('createDialog');
  private receiveDialogEl = viewChild<ElementRef<HTMLDialogElement>>('receiveDialog');

  // ── Core state ─────────────────────────────────────────────────────
  loading    = signal(true);
  error      = signal('');
  orders     = signal<PurchaseOrder[]>([]);
  repuestos  = signal<Repuesto[]>([]);
  warehouses = signal<Warehouse[]>([]);
  expandedId = signal<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────────
  selectedStatus = signal<PurchaseOrderStatus | null>(null);

  filtered = computed(() => {
    const s = this.selectedStatus();
    return s ? this.orders().filter(o => o.status === s) : this.orders();
  });

  kpiCounts = computed(() => {
    const orders = this.orders();
    return {
      all:      orders.length,
      open:     orders.filter(o => o.status === 'DRAFT' || o.status === 'SENT').length,
      partial:  orders.filter(o => o.status === 'PARTIAL').length,
      received: orders.filter(o => o.status === 'RECEIVED').length,
    };
  });

  // ── Create form ────────────────────────────────────────────────────
  createForm = this.emptyCreate();
  createItems = signal<CreateItem[]>([]);
  createSubmitting = signal(false);
  createError      = signal('');

  // ── Action state (send / cancel) ───────────────────────────────────
  actionLoading = signal(false);
  actionError   = signal('');

  // ── Receive dialog ─────────────────────────────────────────────────
  receiveTarget   = signal<PurchaseOrder | null>(null);
  receiptRows     = signal<ReceiptRow[]>([]);
  receiveWarehouseId = signal('');
  receiveSubmitting  = signal(false);
  receiveError       = signal('');

  // ── Exposed constants ──────────────────────────────────────────────
  readonly STATUS_FILTERS = STATUS_FILTERS;
  readonly STATUS_LABEL   = STATUS_LABEL;
  readonly STATUS_COLOR   = STATUS_COLOR;

  animIdx(i: number) { return Math.min(i, 7); }

  repuestoName(id: string) {
    return this.repuestos().find(r => r.id === id)?.name ?? id.slice(0, 8);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      orders:    this.poSvc.getAll(),
      repuestos: this.repuestoSvc.getAll(),
      warehouses: this.warehouseSvc.getAll(),
    }).subscribe({
      next: ({ orders, repuestos, warehouses }) => {
        this.orders.set(orders);
        this.repuestos.set(repuestos);
        this.warehouses.set(warehouses.filter(w => w.active));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las órdenes de compra.');
        this.loading.set(false);
      },
    });
  }

  // ── Filters ────────────────────────────────────────────────────────
  selectStatus(s: PurchaseOrderStatus | null) { this.selectedStatus.set(s); }

  // ── Expand ─────────────────────────────────────────────────────────
  toggleExpand(order: PurchaseOrder) {
    this.expandedId.update(v => v === order.id ? null : order.id);
  }

  // ── Create dialog ──────────────────────────────────────────────────
  openCreate() {
    this.createForm  = this.emptyCreate();
    this.createItems.set([this.emptyItem()]);
    this.createError.set('');
    this.createDialogEl()?.nativeElement.showModal();
  }

  closeCreate() { this.createDialogEl()?.nativeElement.close(); }

  addItem()    { this.createItems.update(list => [...list, this.emptyItem()]); }
  removeItem(i: number) { this.createItems.update(list => list.filter((_, idx) => idx !== i)); }

  submitCreate() {
    const items = this.createItems();
    if (!this.createForm.supplierName || items.some(it => !it.repuestoId || it.quantityOrdered < 1)) return;

    this.createSubmitting.set(true);
    this.createError.set('');

    const body: PurchaseOrderCreateRequest = {
      supplierName: this.createForm.supplierName.trim(),
      supplierRuc:  this.createForm.supplierRuc?.trim()  || undefined,
      notes:        this.createForm.notes?.trim()         || undefined,
      expectedAt:   this.createForm.expectedAt             || undefined,
      items: items.map(it => ({
        repuestoId:      it.repuestoId,
        quantityOrdered: it.quantityOrdered,
        unitCost:        it.unitCost && it.unitCost > 0 ? it.unitCost : undefined,
      })),
    };

    this.poSvc.create(body).subscribe({
      next: created => {
        this.orders.update(list => [created, ...list]);
        this.createSubmitting.set(false);
        this.closeCreate();
      },
      error: err => {
        this.createError.set(err.error?.detail ?? err.error?.title ?? 'Error al crear la OC.');
        this.createSubmitting.set(false);
      },
    });
  }

  // ── Send / Cancel actions ──────────────────────────────────────────
  sendOrder(order: PurchaseOrder) {
    this.actionLoading.set(true);
    this.actionError.set('');
    this.poSvc.send(order.id).subscribe({
      next: updated => {
        this.updateOrder(updated);
        this.actionLoading.set(false);
      },
      error: err => {
        this.actionError.set(err.error?.detail ?? 'Error al enviar la OC.');
        this.actionLoading.set(false);
      },
    });
  }

  cancelOrder(order: PurchaseOrder) {
    if (!confirm(`¿Cancelar la orden ${order.orderNumber}? Esta acción no se puede deshacer.`)) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.poSvc.cancel(order.id).subscribe({
      next: updated => {
        this.updateOrder(updated);
        this.actionLoading.set(false);
      },
      error: err => {
        this.actionError.set(err.error?.detail ?? 'Error al cancelar la OC.');
        this.actionLoading.set(false);
      },
    });
  }

  // ── Receive dialog ─────────────────────────────────────────────────
  openReceive(order: PurchaseOrder) {
    this.poSvc.getById(order.id).subscribe({
      next: full => {
        this.receiveTarget.set(full);
        this.receiptRows.set(
          full.items
            .filter(i => i.quantityPending > 0)
            .map(i => ({
              itemId:           i.id,
              repuestoId:       i.repuestoId,
              repuestoName:     this.repuestoName(i.repuestoId),
              quantityOrdered:  i.quantityOrdered,
              quantityReceived: i.quantityReceived,
              quantityPending:  i.quantityPending,
              inputQty:         i.quantityPending,
            }))
        );
        this.receiveWarehouseId.set(this.warehouses()[0]?.id ?? '');
        this.receiveError.set('');
        this.receiveDialogEl()?.nativeElement.showModal();
      },
      error: () => this.actionError.set('No se pudo cargar el detalle de la OC.'),
    });
  }

  closeReceive() { this.receiveDialogEl()?.nativeElement.close(); }

  submitReceive() {
    const order = this.receiveTarget();
    if (!order || !this.receiveWarehouseId()) return;

    const rows = this.receiptRows().filter(r => r.inputQty > 0);
    if (!rows.length) { this.receiveError.set('Ingresa al menos una cantidad mayor a cero.'); return; }

    this.receiveSubmitting.set(true);
    this.receiveError.set('');

    const body: ReceiveStockRequest = {
      warehouseId: this.receiveWarehouseId(),
      receipts: rows.map(r => ({
        itemId:           r.itemId,
        repuestoId:       r.repuestoId,
        quantityReceived: r.inputQty,
      })),
    };

    this.poSvc.receive(order.id, body).subscribe({
      next: updated => {
        this.updateOrder(updated);
        this.receiveSubmitting.set(false);
        this.closeReceive();
      },
      error: err => {
        this.receiveError.set(err.error?.detail ?? err.error?.title ?? 'Error al registrar la recepción.');
        this.receiveSubmitting.set(false);
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────
  private updateOrder(updated: PurchaseOrder) {
    this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
  }

  private emptyCreate() {
    return { supplierName: '', supplierRuc: '', notes: '', expectedAt: '' };
  }

  private emptyItem(): CreateItem {
    return { repuestoId: '', quantityOrdered: 1, unitCost: undefined };
  }

  canCreateValid() {
    const items = this.createItems();
    return this.createForm.supplierName.trim() &&
           items.length > 0 &&
           items.every(it => it.repuestoId && it.quantityOrdered >= 1);
  }
}
