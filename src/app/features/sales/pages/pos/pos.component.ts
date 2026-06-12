import {
  Component, computed, inject, OnInit, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { RepuestoService }  from '../../../inventory/services/repuesto.service';
import { Repuesto, CATEGORY_LABEL, UOM_LABEL } from '../../../inventory/models/repuesto.model';
import { SaleService }      from '../../services/sale.service';
import {
  ALL_PAYMENT_METHODS, PAYMENT_METHOD_LABEL, PaymentMethod,
} from '../../models/sale.model';
import { CrmService }       from '../../../crm/services/crm.service';
import { Customer }         from '../../../crm/models/crm.model';

interface CartItem {
  repuesto:  Repuesto;
  quantity:  number;
  unitPrice: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './pos.component.html',
  styleUrl:    './pos.component.scss',
})
export class PosComponent implements OnInit {

  private repuestoSvc = inject(RepuestoService);
  private saleSvc     = inject(SaleService);
  private crmSvc      = inject(CrmService);

  // ── Data ─────────────────────────────────────────────────────────
  loadingData = signal(true);
  loadError   = signal('');
  repuestos   = signal<Repuesto[]>([]);
  customers   = signal<Customer[]>([]);

  // ── Search / browse ───────────────────────────────────────────────
  query = signal('');

  searchResults = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    return this.repuestos()
      .filter(r => r.active && (
        r.sku.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.brand ?? '').toLowerCase().includes(q)
      ))
      .slice(0, 8);
  });

  // ── Cart ──────────────────────────────────────────────────────────
  cart = signal<CartItem[]>([]);

  cartTotal = computed(() =>
    this.cart().reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  );

  cartItemCount = computed(() =>
    this.cart().reduce((sum, i) => sum + i.quantity, 0)
  );

  // ── Sale form ─────────────────────────────────────────────────────
  selectedCustomerId = signal('');
  paymentMethod      = signal<PaymentMethod>('CASH');
  notes              = signal('');
  submitting         = signal(false);
  submitError        = signal('');
  saleComplete       = signal(false);
  lastSaleId         = signal('');

  // ── Constants ─────────────────────────────────────────────────────
  readonly PM_LABEL      = PAYMENT_METHOD_LABEL;
  readonly ALL_PM        = ALL_PAYMENT_METHODS;
  readonly CAT_LABEL     = CATEGORY_LABEL;
  readonly UOM_LABEL     = UOM_LABEL;

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      repuestos: this.repuestoSvc.getAll(),
      customers: this.crmSvc.getCustomers(),
    }).subscribe({
      next: ({ repuestos, customers }) => {
        this.repuestos.set(repuestos);
        this.customers.set(customers);
        this.loadingData.set(false);
      },
      error: () => {
        this.loadError.set('No se pudo cargar el catálogo de repuestos.');
        this.loadingData.set(false);
      },
    });
  }

  // ── Cart operations ───────────────────────────────────────────────
  addToCart(rep: Repuesto) {
    this.query.set('');
    this.cart.update(items => {
      const existing = items.find(i => i.repuesto.id === rep.id);
      if (existing) {
        return items.map(i =>
          i.repuesto.id === rep.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...items, {
        repuesto:  rep,
        quantity:  1,
        unitPrice: rep.listPrice ?? 0,
      }];
    });
  }

  updateQty(idx: number, qty: number) {
    if (qty < 1) { this.removeFromCart(idx); return; }
    this.cart.update(items =>
      items.map((item, i) => i === idx ? { ...item, quantity: qty } : item)
    );
  }

  updatePrice(idx: number, price: number) {
    this.cart.update(items =>
      items.map((item, i) => i === idx ? { ...item, unitPrice: price } : item)
    );
  }

  removeFromCart(idx: number) {
    this.cart.update(items => items.filter((_, i) => i !== idx));
  }

  clearCart() {
    this.cart.set([]);
    this.query.set('');
    this.selectedCustomerId.set('');
    this.notes.set('');
    this.paymentMethod.set('CASH');
    this.submitError.set('');
  }

  // ── Submit ────────────────────────────────────────────────────────
  submitSale() {
    const items = this.cart();
    if (items.length === 0 || !this.selectedCustomerId() || this.submitting()) return;

    this.submitting.set(true);
    this.submitError.set('');

    const total = this.cartTotal();

    this.saleSvc.create({
      customerId:    this.selectedCustomerId(),
      totalAmount:   total,
      paymentMethod: this.paymentMethod(),
      notes:         this.notes() || undefined,
      items: items.map(i => ({
        repuestoId: i.repuesto.id,
        quantity:   i.quantity,
        unitPrice:  i.unitPrice,
      })),
    }).subscribe({
      next: sale => {
        this.lastSaleId.set(sale.id);
        this.saleComplete.set(true);
        this.cart.set([]);
        this.selectedCustomerId.set('');
        this.notes.set('');
        this.paymentMethod.set('CASH');
        this.submitting.set(false);
      },
      error: err => {
        this.submitError.set(err.error?.detail ?? 'Error al registrar la venta.');
        this.submitting.set(false);
      },
    });
  }

  // ── Success reset ─────────────────────────────────────────────────
  newSale() {
    this.saleComplete.set(false);
    this.lastSaleId.set('');
    this.submitError.set('');
  }

  // ── Helpers ───────────────────────────────────────────────────────
  animIdx(i: number) { return Math.min(i, 5); }

  customerName(id: string) {
    const c = this.customers().find(c => c.id === id);
    return c ? c.fullName : id;
  }
}
