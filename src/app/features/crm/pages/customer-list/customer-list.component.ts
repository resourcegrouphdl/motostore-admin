import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';
import {
  ALL_INTERACTION_TYPES,
  CreateCustomerRequest, CreateInteractionRequest, CreateOpportunityRequest,
  Customer, CUSTOMER_STATUS_COLOR, CUSTOMER_STATUS_LABEL,
  INTERACTION_TYPE_LABEL, Interaction, InteractionType, Opportunity,
  PIPELINE_STAGE_LABEL,
} from '../../models/crm.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  templateUrl: './customer-list.component.html',
  styleUrl:    './customer-list.component.scss',
})
export class CustomerListComponent implements OnInit {

  private svc = inject(CrmService);

  // ── State ────────────────────────────────────────────────────────
  loading   = signal(true);
  error     = signal('');
  customers = signal<Customer[]>([]);
  query     = signal('');

  // ── Detail panel ─────────────────────────────────────────────────
  selected         = signal<Customer | null>(null);
  opportunities    = signal<Opportunity[]>([]);
  oppLoading       = signal(false);
  interactions     = signal<Interaction[]>([]);
  interLoading     = signal(false);
  selectedOppId    = signal<string | null>(null);

  // ── Create customer dialog ────────────────────────────────────────
  createOpen       = signal(false);
  createSubmitting = signal(false);
  createError      = signal('');
  createForm: CreateCustomerRequest = this.emptyForm();

  // ── Add interaction form ──────────────────────────────────────────
  interForm: CreateInteractionRequest = { type: 'NOTE', notes: '' };
  interSubmitting = signal(false);

  // ── Create opportunity form ───────────────────────────────────────
  oppFormOpen  = signal(false);
  oppSubmitting = signal(false);
  oppForm: CreateOpportunityRequest = { customerId: '', notes: '' };

  // ── Computed ─────────────────────────────────────────────────────
  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.customers();
    return this.customers().filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.dni?.includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  // ── Constants ────────────────────────────────────────────────────
  readonly STATUS_LABEL    = CUSTOMER_STATUS_LABEL;
  readonly STATUS_COLOR    = CUSTOMER_STATUS_COLOR;
  readonly STAGE_LABEL     = PIPELINE_STAGE_LABEL;
  readonly INTER_LABEL     = INTERACTION_TYPE_LABEL;
  readonly ALL_INTER_TYPES = ALL_INTERACTION_TYPES;

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    this.svc.getCustomers().subscribe({
      next:  cs => { this.customers.set(cs); this.loading.set(false); },
      error: _  => { this.error.set('No se pudieron cargar los clientes.'); this.loading.set(false); },
    });
  }

  // ── Select customer ───────────────────────────────────────────────
  selectCustomer(c: Customer) {
    this.selected.set(c);
    this.opportunities.set([]);
    this.interactions.set([]);
    this.selectedOppId.set(null);
    this.oppLoading.set(true);
    this.svc.getAllOpportunities().subscribe({
      next: all => {
        this.opportunities.set(all.filter(o => o.customerId === c.id));
        this.oppLoading.set(false);
      },
      error: _ => this.oppLoading.set(false),
    });
  }

  closeDetail() { this.selected.set(null); }

  // ── Load interactions for an opportunity ──────────────────────────
  loadInteractions(oppId: string) {
    if (this.selectedOppId() === oppId) { this.selectedOppId.set(null); return; }
    this.selectedOppId.set(oppId);
    this.interLoading.set(true);
    this.svc.getInteractions(oppId).subscribe({
      next:  is => { this.interactions.set(is); this.interLoading.set(false); },
      error: _  => this.interLoading.set(false),
    });
  }

  // ── Add interaction ───────────────────────────────────────────────
  submitInteraction() {
    const oppId = this.selectedOppId();
    if (!oppId) return;
    this.interSubmitting.set(true);
    this.svc.addInteraction(oppId, { type: this.interForm.type, notes: this.interForm.notes?.trim() || undefined })
      .subscribe({
        next: inter => {
          this.interactions.update(list => [inter, ...list]);
          this.interForm = { type: 'NOTE', notes: '' };
          this.interSubmitting.set(false);
        },
        error: _ => this.interSubmitting.set(false),
      });
  }

  // ── Create customer ───────────────────────────────────────────────
  openCreate() { this.createForm = this.emptyForm(); this.createError.set(''); this.createOpen.set(true); }
  closeCreate() { this.createOpen.set(false); }

  submitCreate() {
    this.createError.set('');
    this.createSubmitting.set(true);
    this.svc.createCustomer({
      firstName:  this.createForm.firstName.trim(),
      lastName:   this.createForm.lastName.trim(),
      dni:        this.createForm.dni?.trim()   || undefined,
      phone:      this.createForm.phone?.trim() || undefined,
      email:      this.createForm.email?.trim() || undefined,
      notes:      this.createForm.notes?.trim() || undefined,
    }).subscribe({
      next: c => {
        this.customers.update(list => [c, ...list]);
        this.createSubmitting.set(false);
        this.closeCreate();
      },
      error: err => {
        this.createError.set(err?.error?.message ?? 'Error al crear el cliente.');
        this.createSubmitting.set(false);
      },
    });
  }

  // ── Create opportunity ────────────────────────────────────────────
  openOpp(customer: Customer) {
    this.oppForm = { customerId: customer.id, notes: '' };
    this.oppFormOpen.set(true);
  }
  closeOpp() { this.oppFormOpen.set(false); }

  submitOpp() {
    this.oppSubmitting.set(true);
    this.svc.createOpportunity({ customerId: this.oppForm.customerId, notes: this.oppForm.notes?.trim() || undefined })
      .subscribe({
        next: opp => {
          this.opportunities.update(list => [opp, ...list]);
          this.oppSubmitting.set(false);
          this.closeOpp();
        },
        error: _ => this.oppSubmitting.set(false),
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  animIdx(i: number) { return Math.min(i, 7); }

  daysAgo(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  }

  private emptyForm(): CreateCustomerRequest {
    return { firstName: '', lastName: '', dni: '', phone: '', email: '', notes: '' };
  }
}
