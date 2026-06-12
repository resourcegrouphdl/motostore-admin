import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { SaleService } from '../../services/sale.service';
import {
  ALL_PAYMENT_METHODS, CreateSaleRequest, PAYMENT_METHOD_LABEL,
  Sale, SALE_STATUS_LABEL, SaleStatus,
} from '../../models/sale.model';
import { CrmService } from '../../../crm/services/crm.service';
import { MotoService } from '../../../inventory/services/moto.service';
import { Customer } from '../../../crm/models/crm.model';
import { Moto } from '../../../inventory/models/moto.model';
import { DeliveryFormComponent } from '../delivery-form/delivery-form.component';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, RouterLink, DeliveryFormComponent],
  templateUrl: './sale-list.component.html',
  styleUrl:    './sale-list.component.scss',
})
export class SaleListComponent implements OnInit {

  private saleSvc    = inject(SaleService);
  private crmSvc     = inject(CrmService);
  private motoSvc    = inject(MotoService);

  // ── State ────────────────────────────────────────────────────────
  loading   = signal(true);
  error     = signal('');
  sales     = signal<Sale[]>([]);

  // ── Lookup maps for display ───────────────────────────────────────
  customerMap = signal<Map<string, string>>(new Map());
  motoMap     = signal<Map<string, string>>(new Map());

  // ── Create dialog ─────────────────────────────────────────────────
  createOpen       = signal(false);
  createSubmitting = signal(false);
  createError      = signal('');
  customers        = signal<Customer[]>([]);
  motos            = signal<Moto[]>([]);
  createForm: CreateSaleRequest = this.emptyForm();

  // ── Void dialog ───────────────────────────────────────────────────
  voidTarget     = signal<Sale | null>(null);
  voidReason     = signal('');
  voidSubmitting = signal(false);

  // ── Delivery dialog ───────────────────────────────────────────────
  deliveryTarget   = signal<Sale | null>(null);
  deliveredSaleIds = signal<Set<string>>(new Set());  // track registradas localmente

  // ── Computed ─────────────────────────────────────────────────────
  totalRevenue = computed(() =>
    this.sales()
      .filter(s => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + s.totalAmount, 0)
  );

  completedCount = computed(() => this.sales().filter(s => s.status === 'COMPLETED').length);
  voidedCount    = computed(() => this.sales().filter(s => s.status === 'VOIDED').length);

  // ── Constants ────────────────────────────────────────────────────
  readonly PM_LABEL     = PAYMENT_METHOD_LABEL;
  readonly STATUS_LABEL = SALE_STATUS_LABEL;
  readonly ALL_PM       = ALL_PAYMENT_METHODS;

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      sales:     this.saleSvc.getAll().pipe(catchError(() => of([] as Sale[]))),
      customers: this.crmSvc.getCustomers().pipe(catchError(() => of([] as Customer[]))),
      motos:     this.motoSvc.getAll().pipe(catchError(() => of([] as Moto[]))),
    }).subscribe({
      next: ({ sales, customers, motos }) => {
        this.sales.set(sales);
        this.customerMap.set(new Map(customers.map(c => [c.id, c.fullName])));
        this.motoMap.set(new Map(motos.map(m => [m.id, `${m.brand} ${m.model} ${m.year}`])));
        this.customers.set(customers);
        this.motos.set(motos.filter(m => m.status === 'ON_DISPLAY' || m.status === 'IN_WAREHOUSE' || m.status === 'RESERVED'));
        this.loading.set(false);
      },
      error: _ => { this.error.set('Error al cargar ventas.'); this.loading.set(false); },
    });
  }

  // ── Create ───────────────────────────────────────────────────────
  openCreate() {
    this.createForm = this.emptyForm();
    this.createError.set('');
    this.createOpen.set(true);
  }

  closeCreate() { this.createOpen.set(false); }

  submitCreate() {
    this.createError.set('');
    this.createSubmitting.set(true);
    const payload: CreateSaleRequest = {
      ...this.createForm,
      motoId:        this.createForm.motoId        || undefined,
      opportunityId: this.createForm.opportunityId || undefined,
      notes:         this.createForm.notes?.trim() || undefined,
      totalAmount:   +this.createForm.totalAmount,
    };
    this.saleSvc.create(payload).subscribe({
      next: sale => {
        this.sales.update(list => [sale, ...list]);
        this.createSubmitting.set(false);
        this.closeCreate();
      },
      error: err => {
        this.createError.set(err?.error?.message ?? 'Error al registrar la venta.');
        this.createSubmitting.set(false);
      },
    });
  }

  // ── Void ─────────────────────────────────────────────────────────
  openVoid(sale: Sale) { this.voidTarget.set(sale); this.voidReason.set(''); }
  closeVoid() { this.voidTarget.set(null); }

  submitVoid() {
    const target = this.voidTarget();
    if (!target || !this.voidReason().trim()) return;
    this.voidSubmitting.set(true);
    this.saleSvc.voidSale(target.id, this.voidReason().trim()).subscribe({
      next: updated => {
        this.sales.update(list => list.map(s => s.id === updated.id ? updated : s));
        this.voidSubmitting.set(false);
        this.closeVoid();
      },
      error: err => {
        this.voidSubmitting.set(false);
        alert(err?.error?.message ?? 'Error al anular.');
      },
    });
  }

  // ── Delivery ─────────────────────────────────────────────────────
  openDelivery(sale: Sale) { this.deliveryTarget.set(sale); }
  closeDelivery()          { this.deliveryTarget.set(null); }

  onDelivered() {
    const id = this.deliveryTarget()?.id;
    if (id) {
      this.deliveredSaleIds.update(set => new Set([...set, id]));
    }
    this.closeDelivery();
  }

  hasDelivery(saleId: string): boolean {
    return this.deliveredSaleIds().has(saleId);
  }

  // ── Helpers ───────────────────────────────────────────────────────
  customerName(id: string) { return this.customerMap().get(id) ?? id.slice(0, 8) + '…'; }
  motoName(id: string | null) { return id ? (this.motoMap().get(id) ?? '—') : '—'; }
  animIdx(i: number) { return Math.min(i, 7); }

  private emptyForm(): CreateSaleRequest {
    return { customerId: '', motoId: '', opportunityId: '', totalAmount: 0, paymentMethod: 'CASH', notes: '' };
  }
}
