import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditAdminService } from '../../services/credit.service';
import {
  ApproveRequest, CreditApplication, CreditStatus,
  EMPLOYMENT_LABEL, FILTER_STATUSES, QUAL_LABEL,
  STATUS_LABEL, TERM_OPTIONS,
} from '../../models/credit.model';
import { DocumentService } from '../../services/document.service';
import {
  CreditDocument, DOC_TYPE_LABEL, DOC_STATUS_LABEL,
} from '../../models/document.model';

type DetailTab = 'summary' | 'timeline' | 'conditions' | 'documents';

@Component({
  selector:    'app-credit-list',
  standalone:  true,
  imports:     [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './credit-list.component.html',
  styleUrl:    './credit-list.component.scss',
})
export class CreditListComponent implements OnInit {

  private svc    = inject(CreditAdminService);
  private docSvc = inject(DocumentService);

  // ── List state ───────────────────────────────────────────────────
  loading      = signal(true);
  error        = signal('');
  apps         = signal<CreditApplication[]>([]);
  query        = signal('');
  filterStatus = signal<CreditStatus | ''>('');

  // ── Detail panel ─────────────────────────────────────────────────
  selected      = signal<CreditApplication | null>(null);
  activeTab     = signal<DetailTab>('summary');
  actionLoading = signal(false);
  actionError   = signal('');

  // ── Approve form (inline in panel) ───────────────────────────────
  approveOpen = signal(false);
  approveForm: ApproveRequest = this.emptyApprove();

  // ── Reject form (inline in panel) ────────────────────────────────
  rejectOpen   = signal(false);
  rejectReason = signal('');

  // ── Documents tab ─────────────────────────────────────────────────
  documents        = signal<CreditDocument[]>([]);
  docsLoading      = signal(false);
  docReviewLoading = signal<string | null>(null);
  docRejectOpen    = signal<string | null>(null);
  docRejectNotes   = signal('');

  // ── Computed ─────────────────────────────────────────────────────
  filtered = computed(() => {
    let list = this.apps();
    const st = this.filterStatus();
    if (st) list = list.filter(a => a.status === st);
    const q = this.query().toLowerCase().trim();
    if (q) list = list.filter(a =>
      a.fullName.toLowerCase().includes(q) || a.dni.includes(q)
    );
    return list;
  });

  countByStatus = computed(() => {
    const m = new Map<string, number>();
    for (const a of this.apps()) m.set(a.status, (m.get(a.status) ?? 0) + 1);
    return m;
  });

  totalCount    = computed(() => this.apps().length);
  pendingCount  = computed(() =>
    (this.countByStatus().get('SUBMITTED') ?? 0) + (this.countByStatus().get('IN_REVIEW') ?? 0)
  );
  approvedCount  = computed(() =>
    (this.countByStatus().get('APPROVED') ?? 0) + (this.countByStatus().get('CONDITIONAL') ?? 0)
  );
  disbursedCount = computed(() => this.countByStatus().get('DISBURSED') ?? 0);

  cuotaPreview = computed(() => {
    const f = this.approveForm;
    return this.calcCuota(f.amount, 0, f.termMonths, f.rateTea / 100);
  });

  // ── Constants ─────────────────────────────────────────────────────
  readonly STATUS_LABEL    = STATUS_LABEL;
  readonly EMP_LABEL       = EMPLOYMENT_LABEL;
  readonly QUAL_LABEL      = QUAL_LABEL;
  readonly FILTER_STATUSES = FILTER_STATUSES;
  readonly TERM_OPTIONS    = TERM_OPTIONS;
  readonly DOC_TYPE_LABEL  = DOC_TYPE_LABEL;
  readonly DOC_STATUS_LABEL = DOC_STATUS_LABEL;

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit() {
    this.svc.getAll().subscribe({
      next:  apps => { this.apps.set(apps); this.loading.set(false); },
      error: _    => { this.error.set('No se pudieron cargar las solicitudes.'); this.loading.set(false); },
    });
  }

  // ── Detail ────────────────────────────────────────────────────────
  openDetail(app: CreditApplication) {
    this.selected.set(app);
    this.activeTab.set('summary');
    this.actionError.set('');
    this.approveOpen.set(false);
    this.rejectOpen.set(false);
    this.documents.set([]);
    this.docRejectOpen.set(null);
    this.docRejectNotes.set('');
  }

  closeDetail() { this.selected.set(null); }

  setTab(tab: DetailTab) {
    this.activeTab.set(tab);
    this.approveOpen.set(false);
    this.rejectOpen.set(false);
    this.docRejectOpen.set(null);
    if (tab === 'documents') this.loadDocuments();
  }

  loadDocuments() {
    const app = this.selected();
    if (!app) return;
    this.docsLoading.set(true);
    this.docSvc.getByCredit(app.id).subscribe({
      next:  docs => { this.documents.set(docs); this.docsLoading.set(false); },
      error: _    => { this.docsLoading.set(false); },
    });
  }

  openDocUrl(docId: string) {
    this.docSvc.getDownloadUrl(docId).subscribe({
      next: ({ downloadUrl }) => window.open(downloadUrl, '_blank'),
      error: _ => {},
    });
  }

  reviewDoc(docId: string, approved: boolean) {
    const notes = approved ? undefined : (this.docRejectNotes().trim() || undefined);
    this.docReviewLoading.set(docId);
    this.docSvc.review(docId, approved, notes).subscribe({
      next: updated => {
        this.documents.update(list => list.map(d => d.id === updated.id ? updated : d));
        this.docReviewLoading.set(null);
        this.docRejectOpen.set(null);
        this.docRejectNotes.set('');
      },
      error: _ => { this.docReviewLoading.set(null); },
    });
  }

  parseOcr(data: string | null): { key: string; val: string }[] {
    if (!data) return [];
    try {
      const obj = JSON.parse(data) as Record<string, unknown>;
      const labels: Record<string, string> = {
        numero: 'DNI', nombres: 'Nombres', apellidos: 'Apellidos',
        fechaNacimiento: 'Nacimiento', expiracion: 'Vencimiento',
        emisor: 'Empleador', ruc: 'RUC', importeNeto: 'Ingreso neto',
        empresa: 'Empresa', cargo: 'Cargo', fechaIngreso: 'Fecha ingreso',
        banco: 'Banco', saldoPromedio: 'Saldo promedio',
      };
      return Object.entries(obj)
        .filter(([k]) => k !== 'type')
        .map(([k, v]) => ({ key: labels[k] ?? k, val: String(v) }));
    } catch { return []; }
  }

  // ── Actions ───────────────────────────────────────────────────────
  markInReview(app: CreditApplication) {
    this.actionLoading.set(true);
    this.actionError.set('');
    this.svc.markInReview(app.id).subscribe({
      next:  u => { this.updateApp(u); this.actionLoading.set(false); },
      error: e => { this.actionError.set(e?.error?.message ?? 'Error al actualizar'); this.actionLoading.set(false); },
    });
  }

  openApprove() {
    const a = this.selected()!;
    this.approveForm = {
      amount:     a.requestedAmount,
      termMonths: a.requestedTermMonths,
      rateTea:    45,
      fintech:    'MotoYa Digital',
    };
    this.rejectOpen.set(false);
    this.approveOpen.set(true);
  }

  submitApprove() {
    const app = this.selected();
    if (!app) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    const f = this.approveForm;
    this.svc.approve(app.id, f.amount, f.termMonths, f.rateTea, f.fintech).subscribe({
      next: u => {
        this.updateApp(u);
        this.actionLoading.set(false);
        this.approveOpen.set(false);
      },
      error: e => { this.actionError.set(e?.error?.message ?? 'Error al aprobar'); this.actionLoading.set(false); },
    });
  }

  openReject() {
    this.rejectReason.set('');
    this.approveOpen.set(false);
    this.rejectOpen.set(true);
  }

  submitReject() {
    const app = this.selected();
    if (!app || !this.rejectReason().trim()) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.svc.reject(app.id, this.rejectReason().trim()).subscribe({
      next: u => {
        this.updateApp(u);
        this.actionLoading.set(false);
        this.rejectOpen.set(false);
      },
      error: e => { this.actionError.set(e?.error?.message ?? 'Error al rechazar'); this.actionLoading.set(false); },
    });
  }

  disburse(app: CreditApplication) {
    if (!confirm(`¿Confirmar desembolso para ${app.fullName}?`)) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.svc.disburse(app.id).subscribe({
      next:  u => { this.updateApp(u); this.actionLoading.set(false); },
      error: e => { this.actionError.set(e?.error?.message ?? 'Error al desembolsar'); this.actionLoading.set(false); },
    });
  }

  // ── Timeline helpers ──────────────────────────────────────────────
  timelineSteps(app: CreditApplication): TimelineStep[] {
    const done = (label: string, ts: string | null): TimelineStep =>
      ({ label, ts, state: ts ? 'done' : 'pending' });

    const statusOrder: CreditStatus[] = ['SUBMITTED','IN_REVIEW','APPROVED','CONDITIONAL','REJECTED','DISBURSED'];
    const idx = statusOrder.indexOf(app.status);

    return [
      { label: 'Solicitud recibida', ts: app.createdAt,    state: 'done' },
      { label: 'En revisión',        ts: null,              state: idx >= 1 ? (idx === 1 ? 'active' : 'done') : 'pending' },
      {
        label: app.status === 'REJECTED' ? 'Rechazada' : app.status === 'CONDITIONAL' ? 'Aprobada condicional' : 'Aprobada',
        ts:    app.approvedAt ?? app.rejectedAt,
        state: (app.status === 'APPROVED' || app.status === 'CONDITIONAL' || app.status === 'REJECTED')
          ? 'done' : (idx === 1 ? 'pending' : 'pending'),
      },
      { label: 'Desembolsada',       ts: null,              state: app.status === 'DISBURSED' ? 'done' : 'pending' },
    ];
  }

  // ── Score color ───────────────────────────────────────────────────
  scoreColor(score: number): string {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'oklch(74% 0.15 78)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--danger)';
  }

  // ── Cuota calculation ─────────────────────────────────────────────
  cuotaFor(app: CreditApplication): number {
    const amt   = app.approvedAmount    ?? app.requestedAmount;
    const init  = app.initialAmount     ?? 0;
    const term  = app.approvedTermMonths ?? app.requestedTermMonths;
    const tea   = app.approvedRateTea   ? Number(app.approvedRateTea) / 100 : 0.45;
    return this.calcCuota(amt, init, term, tea);
  }

  private calcCuota(amount: number, initial: number, term: number, tea: number): number {
    const financed = amount - initial;
    if (financed <= 0 || term <= 0) return 0;
    const r = Math.pow(1 + tea, 1 / 12) - 1;
    return financed * r * Math.pow(1 + r, term) / (Math.pow(1 + r, term) - 1);
  }

  // ── Misc helpers ──────────────────────────────────────────────────
  animIdx(i: number) { return Math.min(i, 7); }

  daysAgo(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  }

  private updateApp(updated: CreditApplication) {
    this.apps.update(list => list.map(a => a.id === updated.id ? updated : a));
    if (this.selected()?.id === updated.id) this.selected.set(updated);
  }

  private emptyApprove(): ApproveRequest {
    return { amount: 0, termMonths: 24, rateTea: 45, fintech: 'MotoYa Digital' };
  }
}

interface TimelineStep {
  label: string;
  ts:    string | null;
  state: 'done' | 'active' | 'pending';
}
