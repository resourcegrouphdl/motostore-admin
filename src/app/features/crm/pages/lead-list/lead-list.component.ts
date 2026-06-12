import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CrmService } from '../../services/crm.service';
import {
  ALL_LEAD_SOURCES, ALL_LEAD_STATUSES, CreateLeadRequest, Customer,
  Lead, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, LeadSource, LeadStatus,
} from '../../models/crm.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './lead-list.component.html',
  styleUrl:    './lead-list.component.scss',
})
export class LeadListComponent implements OnInit {

  private crmSvc = inject(CrmService);

  // ── State ─────────────────────────────────────────────────────────
  loading   = signal(true);
  error     = signal('');
  leads     = signal<Lead[]>([]);
  customers = signal<Customer[]>([]);

  // ── Filters ───────────────────────────────────────────────────────
  filterStatus = signal<LeadStatus | 'ALL'>('ALL');
  searchQuery  = signal('');

  filtered = computed(() => {
    let list = this.leads();
    const st = this.filterStatus();
    const q  = this.searchQuery().toLowerCase().trim();

    if (st !== 'ALL') list = list.filter(l => l.status === st);
    if (q) list = list.filter(l =>
      (l.modelInterest ?? '').toLowerCase().includes(q) ||
      (l.notes         ?? '').toLowerCase().includes(q) ||
      LEAD_SOURCE_LABEL[l.source].toLowerCase().includes(q)
    );
    return list;
  });

  // ── Status counts ─────────────────────────────────────────────────
  countByStatus = computed(() => {
    const m = new Map<LeadStatus | 'ALL', number>();
    m.set('ALL', this.leads().length);
    for (const s of ALL_LEAD_STATUSES) {
      m.set(s, this.leads().filter(l => l.status === s).length);
    }
    return m;
  });

  // ── Create form ───────────────────────────────────────────────────
  createOpen       = signal(false);
  createSubmitting = signal(false);
  createError      = signal('');
  createForm: CreateLeadRequest = this.emptyForm();

  // ── Status update inline ──────────────────────────────────────────
  updatingId = signal<string | null>(null);

  // ── Constants ────────────────────────────────────────────────────
  readonly STATUS_LABEL  = LEAD_STATUS_LABEL;
  readonly SOURCE_LABEL  = LEAD_SOURCE_LABEL;
  readonly ALL_STATUSES  = ALL_LEAD_STATUSES;
  readonly ALL_SOURCES   = ALL_LEAD_SOURCES;
  readonly FILTER_CHIPS: { value: LeadStatus | 'ALL'; label: string }[] = [
    { value: 'ALL',          label: 'Todos'     },
    { value: 'NEW',          label: 'Nuevos'    },
    { value: 'CONTACTED',    label: 'Contactados' },
    { value: 'QUALIFIED',    label: 'Calificados' },
    { value: 'DISQUALIFIED', label: 'Descartados' },
    { value: 'CONVERTED',    label: 'Convertidos' },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      leads:     this.crmSvc.getLeads().pipe(catchError(() => of([] as Lead[]))),
      customers: this.crmSvc.getCustomers().pipe(catchError(() => of([] as Customer[]))),
    }).subscribe({
      next: ({ leads, customers }) => {
        this.leads.set(leads);
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar leads.'); this.loading.set(false); },
    });
  }

  // ── Create ────────────────────────────────────────────────────────
  openCreate()  { this.createForm = this.emptyForm(); this.createError.set(''); this.createOpen.set(true); }
  closeCreate() { this.createOpen.set(false); }

  submitCreate() {
    this.createError.set('');
    this.createSubmitting.set(true);
    const body: CreateLeadRequest = {
      ...this.createForm,
      customerId:    this.createForm.customerId    || undefined,
      modelInterest: this.createForm.modelInterest?.trim() || undefined,
      notes:         this.createForm.notes?.trim()         || undefined,
      budgetMin:     this.createForm.budgetMin ? +this.createForm.budgetMin : undefined,
      budgetMax:     this.createForm.budgetMax ? +this.createForm.budgetMax : undefined,
    };
    this.crmSvc.createLead(body).subscribe({
      next: lead => {
        this.leads.update(list => [lead, ...list]);
        this.createSubmitting.set(false);
        this.closeCreate();
      },
      error: err => {
        this.createError.set(err?.error?.message ?? 'Error al crear el lead.');
        this.createSubmitting.set(false);
      },
    });
  }

  // ── Status update ─────────────────────────────────────────────────
  setStatus(lead: Lead, status: LeadStatus) {
    if (lead.status === status) return;
    this.updatingId.set(lead.id);
    this.crmSvc.updateLeadStatus(lead.id, status).subscribe({
      next: updated => {
        this.leads.update(list => list.map(l => l.id === updated.id ? updated : l));
        this.updatingId.set(null);
      },
      error: () => this.updatingId.set(null),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  animIdx(i: number) { return Math.min(i, 7); }
  customerName(id: string | null) {
    if (!id) return null;
    const c = this.customers().find(c => c.id === id);
    return c ? c.fullName : null;
  }

  private emptyForm(): CreateLeadRequest {
    return { source: 'WEB', customerId: '', modelInterest: '', notes: '' };
  }
}
