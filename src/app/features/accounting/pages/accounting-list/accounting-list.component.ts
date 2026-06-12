import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../services/accounting.service';
import {
  ACCOUNT_TYPE_LABEL, ACCOUNT_TYPES, Account, AccountType, AccountingPeriod,
  ENTRY_SOURCE_LABEL, IncomeStatementRow, JournalEntry, MONTH_LABEL,
  PERIOD_STATUS_LABEL, SunatPurchaseRecord, SunatSalesRecord, TrialBalanceRow,
} from '../../models/accounting.model';

type AccountingTab   = 'journal' | 'chart' | 'trial' | 'income' | 'sunat' | 'periods';
type SunatSubTab     = 'sales' | 'purchases';
type AccountTypeFilter = 'ALL' | AccountType;

@Component({
  selector:    'app-accounting-list',
  standalone:  true,
  imports:     [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './accounting-list.component.html',
  styleUrl:    './accounting-list.component.scss',
})
export class AccountingListComponent implements OnInit {
  private svc = inject(AccountingService);

  // ── Periods ────────────────────────────────────────────────────
  periods          = signal<AccountingPeriod[]>([]);
  loadingPeriods   = signal(true);
  periodsError     = signal('');
  selectedPeriodId = signal('');

  // ── Navigation ─────────────────────────────────────────────────
  activeTab = signal<AccountingTab>('journal');

  // ── Journal (Libro Diario) ─────────────────────────────────────
  journalEntries  = signal<JournalEntry[]>([]);
  loadingJournal  = signal(false);
  journalError    = signal('');
  journalQuery    = signal('');
  expandedEntryId = signal<string | null>(null);

  // ── Chart of Accounts (Plan de Cuentas) ───────────────────────
  accounts        = signal<Account[]>([]);
  loadingChart    = signal(false);
  chartError      = signal('');
  chartTypeFilter = signal<AccountTypeFilter>('ALL');
  chartQuery      = signal('');

  // ── Trial Balance (Balance de Comprobación) ───────────────────
  trialBalance  = signal<TrialBalanceRow[]>([]);
  loadingTrial  = signal(false);
  trialError    = signal('');

  // ── Income Statement (Estado de Resultados) ───────────────────
  incomeStatement = signal<IncomeStatementRow[]>([]);
  loadingIncome   = signal(false);
  incomeError     = signal('');

  // ── SUNAT ──────────────────────────────────────────────────────
  sunatSubTab     = signal<SunatSubTab>('sales');
  sunatSales      = signal<SunatSalesRecord[]>([]);
  sunatPurchases  = signal<SunatPurchaseRecord[]>([]);
  loadingSunat    = signal(false);
  sunatError      = signal('');

  // ── Period close ───────────────────────────────────────────────
  closeConfirmId = signal<string | null>(null);
  closeLoading   = signal(false);
  closeError     = signal('');

  // ── Computed ───────────────────────────────────────────────────
  selectedPeriod = computed(() =>
    this.periods().find(p => p.id === this.selectedPeriodId()) ?? null
  );

  filteredJournal = computed(() => {
    const q = this.journalQuery().toLowerCase().trim();
    if (!q) return this.journalEntries();
    return this.journalEntries().filter(e =>
      e.description.toLowerCase().includes(q) ||
      e.reference.toLowerCase().includes(q) ||
      ENTRY_SOURCE_LABEL[e.source].toLowerCase().includes(q)
    );
  });

  filteredAccounts = computed(() => {
    let list = this.accounts();
    const f = this.chartTypeFilter();
    if (f !== 'ALL') list = list.filter(a => a.type === f);
    const q = this.chartQuery().toLowerCase().trim();
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
    );
    return list;
  });

  trialBalanceTotals = computed(() => ({
    debit:  this.trialBalance().reduce((s, r) => s + r.debitBalance,  0),
    credit: this.trialBalance().reduce((s, r) => s + r.creditBalance, 0),
  }));

  isBalanced = computed(() => {
    const t = this.trialBalanceTotals();
    return this.trialBalance().length > 0 && Math.abs(t.debit - t.credit) < 0.01;
  });

  netIncome = computed(() => {
    const last = [...this.incomeStatement()].reverse().find(r => r.isTotal);
    return last?.amount ?? null;
  });

  closeChecklist = computed(() => {
    const period = this.selectedPeriod();
    const t = this.trialBalanceTotals();
    return [
      {
        label: 'Período está en estado abierto',
        passed: period?.status === 'OPEN',
      },
      {
        label: 'Balance de comprobación cuadrado (Debe = Haber)',
        passed: this.isBalanced(),
      },
      {
        label: 'El período contiene al menos un asiento',
        passed: (period?.totalEntries ?? 0) > 0,
      },
      {
        label: 'Todas las cuentas de resultado han sido saldadas',
        passed: this.trialBalance().filter(r => r.level >= 3).length > 0,
      },
    ];
  });

  canClose = computed(() =>
    this.closeChecklist().every(c => c.passed) && !this.closeLoading()
  );

  sunatSalesTotals = computed(() => ({
    base:  this.sunatSales().reduce((s, r) => s + r.baseImponible, 0),
    igv:   this.sunatSales().reduce((s, r) => s + r.igv, 0),
    total: this.sunatSales().reduce((s, r) => s + r.total, 0),
  }));

  sunatPurchasesTotals = computed(() => ({
    base:  this.sunatPurchases().reduce((s, r) => s + r.baseImponible, 0),
    igv:   this.sunatPurchases().reduce((s, r) => s + r.igv, 0),
    total: this.sunatPurchases().reduce((s, r) => s + r.total, 0),
  }));

  // ── Constants exposed to template ─────────────────────────────
  readonly ACCOUNT_TYPE_LABEL  = ACCOUNT_TYPE_LABEL;
  readonly ACCOUNT_TYPES       = ACCOUNT_TYPES;
  readonly ENTRY_SOURCE_LABEL  = ENTRY_SOURCE_LABEL;
  readonly PERIOD_STATUS_LABEL = PERIOD_STATUS_LABEL;
  readonly MONTH_LABEL         = MONTH_LABEL;

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit() {
    this.svc.getPeriods().subscribe({
      next: periods => {
        this.periods.set(periods);
        this.loadingPeriods.set(false);
        if (periods.length > 0) {
          const open = periods.find(p => p.status === 'OPEN') ?? periods[0];
          this.selectedPeriodId.set(open.id);
          this.loadJournal();
        }
      },
      error: _ => {
        this.periodsError.set('No se pudieron cargar los períodos contables.');
        this.loadingPeriods.set(false);
      },
    });
    this.loadChart();
  }

  // ── Tab navigation ─────────────────────────────────────────────
  setTab(tab: AccountingTab) {
    this.activeTab.set(tab);
    const pid = this.selectedPeriodId();
    if (!pid) return;

    switch (tab) {
      case 'journal':
        if (!this.journalError() && this.journalEntries().length === 0) this.loadJournal();
        break;
      case 'chart':
        if (!this.chartError() && this.accounts().length === 0) this.loadChart();
        break;
      case 'trial':
        if (!this.trialError() && this.trialBalance().length === 0) this.loadTrialBalance();
        break;
      case 'income':
        if (!this.incomeError() && this.incomeStatement().length === 0) this.loadIncomeStatement();
        break;
      case 'sunat':
        if (!this.sunatError() && this.sunatSales().length === 0 && this.sunatPurchases().length === 0) this.loadSunat();
        break;
    }
  }

  // ── Period selection ───────────────────────────────────────────
  changePeriod(id: string) {
    this.selectedPeriodId.set(id);
    this.journalEntries.set([]);
    this.trialBalance.set([]);
    this.incomeStatement.set([]);
    this.sunatSales.set([]);
    this.sunatPurchases.set([]);
    this.journalError.set('');
    this.trialError.set('');
    this.incomeError.set('');
    this.sunatError.set('');
    this.setTab(this.activeTab());
    if (this.activeTab() !== 'journal') this.loadJournal();
  }

  // ── Data loaders ───────────────────────────────────────────────
  loadJournal() {
    const pid = this.selectedPeriodId();
    if (!pid) return;
    this.loadingJournal.set(true);
    this.journalError.set('');
    this.svc.getJournalEntries(pid).subscribe({
      next:  entries => { this.journalEntries.set(entries); this.loadingJournal.set(false); },
      error: _       => { this.journalError.set('No se pudo cargar el libro diario.'); this.loadingJournal.set(false); },
    });
  }

  private loadChart() {
    this.loadingChart.set(true);
    this.svc.getChartOfAccounts().subscribe({
      next:  accs => { this.accounts.set(accs); this.loadingChart.set(false); },
      error: _    => { this.chartError.set('No se pudo cargar el plan de cuentas.'); this.loadingChart.set(false); },
    });
  }

  loadTrialBalance() {
    const pid = this.selectedPeriodId();
    if (!pid) return;
    this.loadingTrial.set(true);
    this.trialError.set('');
    this.svc.getTrialBalance(pid).subscribe({
      next:  rows => { this.trialBalance.set(rows); this.loadingTrial.set(false); },
      error: _    => { this.trialError.set('No se pudo cargar el balance de comprobación.'); this.loadingTrial.set(false); },
    });
  }

  loadIncomeStatement() {
    const pid = this.selectedPeriodId();
    if (!pid) return;
    this.loadingIncome.set(true);
    this.incomeError.set('');
    this.svc.getIncomeStatement(pid).subscribe({
      next:  rows => { this.incomeStatement.set(rows); this.loadingIncome.set(false); },
      error: _    => { this.incomeError.set('No se pudo cargar el estado de resultados.'); this.loadingIncome.set(false); },
    });
  }

  loadSunat() {
    const pid = this.selectedPeriodId();
    if (!pid) return;
    this.loadingSunat.set(true);
    this.sunatError.set('');
    this.svc.getSunatSales(pid).subscribe({
      next:  recs => { this.sunatSales.set(recs); this.loadingSunat.set(false); },
      error: _    => { this.sunatError.set('No se pudo cargar el registro de ventas.'); this.loadingSunat.set(false); },
    });
    this.svc.getSunatPurchases(pid).subscribe({
      next:  recs => this.sunatPurchases.set(recs),
      error: _    => {},
    });
  }

  // ── Journal actions ────────────────────────────────────────────
  toggleEntry(id: string) {
    this.expandedEntryId.update(cur => cur === id ? null : id);
  }

  retryJournal() { this.journalEntries.set([]); this.loadJournal(); }

  // ── Chart actions ──────────────────────────────────────────────
  retryChart()  { this.chartError.set(''); this.accounts.set([]); this.loadChart(); }

  // ── Trial balance actions ──────────────────────────────────────
  retryTrial()  { this.trialBalance.set([]); this.loadTrialBalance(); }

  // ── Income actions ─────────────────────────────────────────────
  retryIncome() { this.incomeStatement.set([]); this.loadIncomeStatement(); }

  // ── SUNAT actions ──────────────────────────────────────────────
  retrySunat()  { this.sunatSales.set([]); this.sunatPurchases.set([]); this.loadSunat(); }

  downloadSunat(type: SunatSubTab) {
    const period = this.selectedPeriod();
    if (!period) return;
    const tag = `${period.year}-${String(period.month).padStart(2, '0')}`;
    if (type === 'sales') {
      const header = 'Correlativo\tFecha\tTipo\tSerie\tNúmero\tRUC\tRazón Social\tBase Imponible\tIGV\tTotal';
      const lines = this.sunatSales().map(r =>
        `${r.correlativo}\t${r.fechaEmision}\t${r.tipoDoc}\t${r.serie}\t${r.numero}\t${r.rucCliente}\t${r.razonSocial}\t${r.baseImponible.toFixed(2)}\t${r.igv.toFixed(2)}\t${r.total.toFixed(2)}`
      );
      this._triggerDownload([header, ...lines].join('\r\n'), `PLE_Ventas_${tag}.txt`);
    } else {
      const header = 'Correlativo\tFecha\tTipo\tSerie\tNúmero\tRUC\tRazón Social\tBase Imponible\tIGV\tTotal';
      const lines = this.sunatPurchases().map(r =>
        `${r.correlativo}\t${r.fechaEmision}\t${r.tipoDoc}\t${r.serie}\t${r.numero}\t${r.rucProveedor}\t${r.razonSocial}\t${r.baseImponible.toFixed(2)}\t${r.igv.toFixed(2)}\t${r.total.toFixed(2)}`
      );
      this._triggerDownload([header, ...lines].join('\r\n'), `PLE_Compras_${tag}.txt`);
    }
  }

  private _triggerDownload(content: string, filename: string) {
    const blob = new Blob(['﻿' + content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Period close ───────────────────────────────────────────────
  requestClose(periodId: string) {
    this.closeConfirmId.set(periodId);
    this.closeError.set('');
    if (this.trialBalance().length === 0) this.loadTrialBalance();
  }

  cancelClose() { this.closeConfirmId.set(null); this.closeError.set(''); }

  confirmClose() {
    const id = this.closeConfirmId();
    if (!id || !this.canClose()) return;
    this.closeLoading.set(true);
    this.closeError.set('');
    this.svc.closePeriod(id).subscribe({
      next: updated => {
        this.periods.update(list => list.map(p => p.id === id ? updated : p));
        this.closeConfirmId.set(null);
        this.closeLoading.set(false);
      },
      error: e => {
        this.closeError.set(e?.error?.message ?? 'Error al cerrar el período.');
        this.closeLoading.set(false);
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  periodLabel(p: AccountingPeriod): string {
    return `${MONTH_LABEL[p.month]} ${p.year}`;
  }

  accountIndent(level: number): string {
    return `${(level - 1) * 18 + 12}px`;
  }

  trialNetBalance(row: TrialBalanceRow): number {
    return row.debitBalance - row.creditBalance;
  }

  trackById(_: number, item: { id: string }) { return item.id; }
  trackByCode(_: number, item: { code: string }) { return item.code; }
  trackByIdx(i: number) { return i; }
}
