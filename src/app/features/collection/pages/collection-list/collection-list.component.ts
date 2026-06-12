import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionService } from '../../services/collection.service';
import { ExportService }    from '../../../../core/services/export.service';
import {
  AGING_FILTERS, agingBucket, AgingBucket,
  CollectionPayment, INSTALLMENT_STATUS_LABEL,
  OverdueAccount, PAYMENT_METHOD_LABEL, PaymentMethod,
  PaymentReminderResponse, RegisterPaymentRequest, ScheduleEntry,
} from '../../models/collection.model';

type DetailTab = 'schedule' | 'payments';

interface PaymentFormState {
  amount:    number | undefined;
  method:    PaymentMethod;
  reference: string;
  notes:     string;
}

@Component({
  selector:    'app-collection-list',
  standalone:  true,
  imports:     [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './collection-list.component.html',
  styleUrl:    './collection-list.component.scss',
})
export class CollectionListComponent implements OnInit {

  private svc    = inject(CollectionService);
  private export = inject(ExportService);

  // ── List state ───────────────────────────────────────────────────
  loading      = signal(true);
  error        = signal('');
  accounts     = signal<OverdueAccount[]>([]);
  query        = signal('');
  filterBucket = signal<AgingBucket | ''>('');

  // ── Detail panel ─────────────────────────────────────────────────
  selected  = signal<OverdueAccount | null>(null);
  activeTab = signal<DetailTab>('schedule');

  // ── Schedule tab ─────────────────────────────────────────────────
  schedule      = signal<ScheduleEntry[]>([]);
  schedLoading  = signal(false);

  // ── Payments tab ─────────────────────────────────────────────────
  payments        = signal<CollectionPayment[]>([]);
  paymentsLoading = signal(false);
  paymentFormOpen  = signal(false);
  paymentLoading   = signal(false);
  paymentError     = signal('');
  paymentSuccess   = signal(false);
  schedError       = signal('');
  paymentsError    = signal('');
  paymentForm: PaymentFormState = this.emptyPayment();

  // ── Export ────────────────────────────────────────────────────────
  exporting = signal(false);

  exportCsv() {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.export.download('collection/overdue/export', 'cobranza-mora.csv')
      .subscribe({ next: () => this.exporting.set(false), error: () => this.exporting.set(false) });
  }

  // ── Reminder ──────────────────────────────────────────────────────
  reminderLoading  = signal(false);
  reminderSentIds  = signal<Set<string>>(new Set());
  reminderResult   = signal<PaymentReminderResponse | null>(null);

  // ── Computed — list ──────────────────────────────────────────────
  filtered = computed(() => {
    let list = this.accounts();
    const bkt = this.filterBucket();
    if (bkt) list = list.filter(a => agingBucket(a.daysOverdue) === bkt);
    const q = this.query().toLowerCase().trim();
    if (q) list = list.filter(a =>
      a.fullName.toLowerCase().includes(q) || a.dni.includes(q) ||
      (a.phone ?? '').includes(q)
    );
    return list;
  });

  countByBucket = computed(() => {
    const m = new Map<AgingBucket, number>();
    for (const a of this.accounts()) {
      const b = agingBucket(a.daysOverdue);
      m.set(b, (m.get(b) ?? 0) + 1);
    }
    return m;
  });

  // ── Computed — KPIs ──────────────────────────────────────────────
  totalOverdueSoles = computed(() =>
    this.accounts().reduce((s, a) => s + a.totalOverdueSoles, 0)
  );
  accountsCount = computed(() => this.accounts().length);

  recoveredThisMonth = computed(() => {
    const now = new Date();
    return this.payments().reduce((s, p) => {
      const d = new Date(p.paymentDate);
      return (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
        ? s + p.amount : s;
    }, 0);
  });

  recoveryRate = computed(() => {
    const total = this.totalOverdueSoles();
    if (total <= 0) return 0;
    return Math.min(100, (this.recoveredThisMonth() / total) * 100);
  });

  recoveryRateClass = computed(() => {
    const r = this.recoveryRate();
    if (r >= 70) return 'kpi-num--ok';
    if (r >= 40) return 'kpi-num--warn';
    return 'kpi-num--danger';
  });

  // ── Constants ─────────────────────────────────────────────────────
  readonly AGING_FILTERS            = AGING_FILTERS;
  readonly PAYMENT_METHOD_LABEL     = PAYMENT_METHOD_LABEL;
  readonly INSTALLMENT_STATUS_LABEL = INSTALLMENT_STATUS_LABEL;
  readonly paymentMethods: PaymentMethod[] = ['CASH', 'TRANSFER', 'QR', 'CARD'];

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit() {
    this.svc.getOverdueAccounts().subscribe({
      next:  accounts => { this.accounts.set(accounts); this.loading.set(false); },
      error: _        => { this.error.set('No se pudieron cargar las cuentas en mora.'); this.loading.set(false); },
    });
  }

  // ── Detail panel ─────────────────────────────────────────────────
  openDetail(account: OverdueAccount) {
    this.selected.set(account);
    this.activeTab.set('payments');
    this.paymentFormOpen.set(false);
    this.paymentError.set('');
    this.paymentSuccess.set(false);
    this.schedError.set('');
    this.paymentsError.set('');
    this.schedule.set([]);
    this.payments.set([]);
    this.loadPayments(account.creditApplicationId);
  }

  closeDetail() { this.selected.set(null); }

  setTab(tab: DetailTab) {
    this.activeTab.set(tab);
    this.paymentFormOpen.set(false);
    this.paymentError.set('');
    this.paymentSuccess.set(false);
    const id = this.selected()?.creditApplicationId;
    if (!id) return;
    if (tab === 'schedule' && this.schedule().length === 0 && !this.schedError()) this.loadSchedule(id);
    if (tab === 'payments' && this.payments().length === 0 && !this.paymentsError()) this.loadPayments(id);
  }

  private loadSchedule(creditId: string) {
    this.schedLoading.set(true);
    this.schedError.set('');
    this.svc.getSchedule(creditId).subscribe({
      next:  entries => { this.schedule.set(entries); this.schedLoading.set(false); },
      error: _       => { this.schedError.set('No se pudo cargar el cronograma.'); this.schedLoading.set(false); },
    });
  }

  retrySchedule() {
    const id = this.selected()?.creditApplicationId;
    if (id) this.loadSchedule(id);
  }

  private loadPayments(creditId: string) {
    this.paymentsLoading.set(true);
    this.paymentsError.set('');
    this.svc.getPayments(creditId).subscribe({
      next:  payments => { this.payments.set(payments); this.paymentsLoading.set(false); },
      error: _        => { this.paymentsError.set('No se pudo cargar los pagos.'); this.paymentsLoading.set(false); },
    });
  }

  retryPayments() {
    const id = this.selected()?.creditApplicationId;
    if (id) this.loadPayments(id);
  }

  // ── Payment form ──────────────────────────────────────────────────
  openPaymentForm() {
    this.paymentForm = this.emptyPayment();
    this.paymentError.set('');
    this.paymentFormOpen.set(true);
  }

  submitPayment() {
    const account = this.selected();
    const { amount, method, reference, notes } = this.paymentForm;
    if (!account || !amount) return;
    this.paymentLoading.set(true);
    this.paymentError.set('');

    const req: RegisterPaymentRequest = {
      amount,
      method,
      reference: reference || undefined,
      notes:     notes     || undefined,
    };

    this.svc.registerPayment(account.creditApplicationId, req).subscribe({
      next: payment => {
        this.payments.update(list => [payment, ...list]);
        this.accounts.update(list =>
          list.map(a => a.creditApplicationId === account.creditApplicationId
            ? { ...a, totalOverdueSoles: Math.max(0, a.totalOverdueSoles - req.amount) }
            : a
          )
        );
        this.selected.update(prev =>
          prev ? { ...prev, totalOverdueSoles: Math.max(0, prev.totalOverdueSoles - req.amount) } : prev
        );
        this.paymentLoading.set(false);
        this.paymentFormOpen.set(false);
        this.paymentSuccess.set(true);
        setTimeout(() => this.paymentSuccess.set(false), 3500);
      },
      error: e => {
        this.paymentError.set(e?.error?.message ?? 'Error al registrar el pago.');
        this.paymentLoading.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  bucket(days: number): AgingBucket { return agingBucket(days); }
  animIdx(i: number) { return Math.min(i, 5); }

  agingLabel(days: number): string {
    const map: Record<AgingBucket, string> = { '0-30': '1–30d', '31-60': '31–60d', '61-90': '61–90d', '90+': '+90d' };
    return map[agingBucket(days)];
  }

  overdueInSchedule(entries: ScheduleEntry[]): number {
    return entries.filter(e => e.status === 'OVERDUE').reduce((s, e) => s + e.total, 0);
  }

  needsReference(method: PaymentMethod): boolean {
    return method === 'TRANSFER' || method === 'QR';
  }

  private emptyPayment(): PaymentFormState {
    return { amount: undefined, method: 'CASH', reference: '', notes: '' };
  }

  // ── Reminder helpers ──────────────────────────────────────────────
  isReminderSent(creditId: string): boolean {
    return this.reminderSentIds().has(creditId);
  }

  sendReminder(account: OverdueAccount) {
    if (this.reminderLoading()) return;
    this.reminderLoading.set(true);
    this.reminderResult.set(null);
    this.svc.sendReminder(account.creditApplicationId).subscribe({
      next: result => {
        this.reminderResult.set(result);
        if (result.sent) {
          this.reminderSentIds.update(s => new Set([...s, account.creditApplicationId]));
        }
        this.reminderLoading.set(false);
      },
      error: _ => {
        this.reminderResult.set({
          creditApplicationId: account.creditApplicationId,
          phone: null, wamid: null, sent: false,
          message: 'Error de conexión al enviar el recordatorio.',
        });
        this.reminderLoading.set(false);
      },
    });
  }
}
