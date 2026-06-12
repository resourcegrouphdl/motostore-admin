import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BillingService } from '../../services/billing.service';
import { ExportService }  from '../../../../core/services/export.service';
import { SaleService }    from '../../../sales/services/sale.service';
import { CrmService }     from '../../../crm/services/crm.service';
import {
  BillingDocument, DOC_STATUS_LABEL, DOC_TYPE_LABEL,
  EMITTABLE_TYPES, EmitRequest,
} from '../../models/billing.model';
import { Sale } from '../../../sales/models/sale.model';
import { Customer } from '../../../crm/models/crm.model';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule],
  templateUrl: './billing-list.component.html',
  styleUrl:    './billing-list.component.scss',
})
export class BillingListComponent implements OnInit {

  private billingSvc = inject(BillingService);
  private saleSvc    = inject(SaleService);
  private crmSvc     = inject(CrmService);
  private exportSvc  = inject(ExportService);

  // ── State ────────────────────────────────────────────────────────
  loading   = signal(true);
  exporting = signal(false);
  error     = signal('');
  documents = signal<BillingDocument[]>([]);
  sales     = signal<Map<string, Sale>>(new Map());
  customers = signal<Map<string, string>>(new Map());

  // ── Emit dialog ───────────────────────────────────────────────────
  emitOpen       = signal(false);
  emitSubmitting = signal(false);
  emitError      = signal('');
  pendingSales   = signal<Sale[]>([]);
  emitForm: EmitRequest & { customerRuc: string; customerName: string } = this.emptyEmit();

  // ── Detail panel ──────────────────────────────────────────────────
  selectedDoc = signal<BillingDocument | null>(null);
  pdfLoading  = signal(false);

  // ── Computed ─────────────────────────────────────────────────────
  emittedCount = computed(() => this.documents().filter(d => d.status === 'EMITTED').length);
  failedCount  = computed(() => this.documents().filter(d => d.status === 'FAILED').length);
  totalIgv     = computed(() =>
    this.documents().filter(d => d.status === 'EMITTED')
      .reduce((s, d) => s + (d.igv ?? 0), 0));

  // ── Constants ────────────────────────────────────────────────────
  readonly TYPE_LABEL   = DOC_TYPE_LABEL;
  readonly STATUS_LABEL = DOC_STATUS_LABEL;
  readonly EMIT_TYPES   = EMITTABLE_TYPES;

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      docs:      this.billingSvc.getAll().pipe(catchError(() => of([] as BillingDocument[]))),
      sales:     this.saleSvc.getAll().pipe(catchError(() => of([] as Sale[]))),
      customers: this.crmSvc.getCustomers().pipe(catchError(() => of([] as Customer[]))),
    }).subscribe({
      next: ({ docs, sales, customers }) => {
        this.documents.set(docs);
        this.sales.set(new Map(sales.map(s => [s.id, s])));
        this.customers.set(new Map(customers.map(c => [c.id, c.fullName])));
        // Ventas que aún no tienen documento emitido
        const docSaleIds = new Set(docs.filter(d => d.saleId).map(d => d.saleId!));
        this.pendingSales.set(sales.filter(s => !docSaleIds.has(s.id) && s.status === 'COMPLETED'));
        this.loading.set(false);
      },
      error: _ => { this.error.set('Error al cargar documentos.'); this.loading.set(false); },
    });
  }

  // ── Detail ───────────────────────────────────────────────────────
  openDetail(doc: BillingDocument) { this.selectedDoc.set(doc); }
  closeDetail() { this.selectedDoc.set(null); }

  // ── Emit ─────────────────────────────────────────────────────────
  openEmit() { this.emitForm = this.emptyEmit(); this.emitError.set(''); this.emitOpen.set(true); }
  closeEmit() { this.emitOpen.set(false); }

  submitEmit() {
    if (!this.emitForm.saleId || !this.emitForm.type) return;
    this.emitError.set('');
    this.emitSubmitting.set(true);
    const req: EmitRequest = {
      saleId:       this.emitForm.saleId,
      type:         this.emitForm.type,
      customerRuc:  this.emitForm.customerRuc?.trim() || undefined,
      customerName: this.emitForm.customerName?.trim() || undefined,
    };
    this.billingSvc.emit(req).subscribe({
      next: doc => {
        this.documents.update(list => [doc, ...list]);
        this.pendingSales.update(list => list.filter(s => s.id !== doc.saleId));
        this.emitSubmitting.set(false);
        this.closeEmit();
      },
      error: err => {
        this.emitError.set(err?.error?.message ?? 'Error al emitir el documento.');
        this.emitSubmitting.set(false);
      },
    });
  }

  // ── Void ─────────────────────────────────────────────────────────
  voidDocument(doc: BillingDocument) {
    if (!confirm(`¿Anular ${doc.documentNumber}? Esta acción no se puede deshacer.`)) return;
    this.billingSvc.voidDocument(doc.id).subscribe({
      next: updated => {
        this.documents.update(list => list.map(d => d.id === updated.id ? updated : d));
        if (this.selectedDoc()?.id === updated.id) this.selectedDoc.set(updated);
      },
    });
  }

  // ── PDF ───────────────────────────────────────────────────────────
  downloadPdf(doc: BillingDocument) {
    if (this.pdfLoading()) return;
    this.pdfLoading.set(true);
    this.billingSvc.downloadPdf(doc.id, `${doc.documentNumber}.pdf`).subscribe({
      next:  () => this.pdfLoading.set(false),
      error: () => this.pdfLoading.set(false),
    });
  }

  // ── Export ────────────────────────────────────────────────────────
  exportCsv() {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.exportSvc.download('billing/export', 'facturacion.csv')
      .subscribe({ next: () => this.exporting.set(false), error: () => this.exporting.set(false) });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  saleCustomer(saleId: string | null): string {
    if (!saleId) return '—';
    const sale = this.sales().get(saleId);
    if (!sale) return '—';
    return this.customers().get(sale.customerId) ?? sale.customerId.slice(0, 8) + '…';
  }

  animIdx(i: number) { return Math.min(i, 7); }

  private emptyEmit(): EmitRequest & { customerRuc: string; customerName: string } {
    return { saleId: '', type: 'BOLETA', customerRuc: '', customerName: '' };
  }
}
