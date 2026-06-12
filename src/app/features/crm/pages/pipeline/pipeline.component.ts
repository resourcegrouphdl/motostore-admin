import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';

import { CrmService } from '../../services/crm.service';
import {
  ALL_INTERACTION_TYPES, ALL_PIPELINE_STAGES,
  CreateInteractionRequest, Customer, Interaction,
  InteractionType, INTERACTION_TYPE_LABEL, Opportunity,
  PIPELINE_STAGE_LABEL, PIPELINE_STAGES_ACTIVE, PipelineStage,
} from '../../models/crm.model';

/** Oportunidad enriquecida con nombre del cliente para mostrar en cards */
interface RichOpportunity extends Opportunity {
  customerFullName: string;
  daysInStage:      number;
}

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pipeline.component.html',
  styleUrl:    './pipeline.component.scss',
})
export class PipelineComponent implements OnInit {

  private svc = inject(CrmService);

  // ── State ────────────────────────────────────────────────────────
  loading    = signal(true);
  error      = signal('');
  customers  = signal<Map<string, string>>(new Map()); // id → fullName
  opps       = signal<RichOpportunity[]>([]);

  // ── Selected card (detail panel) ─────────────────────────────────
  selected      = signal<RichOpportunity | null>(null);
  interactions  = signal<Interaction[]>([]);
  interLoading  = signal(false);
  interForm: CreateInteractionRequest = { type: 'NOTE', notes: '' };
  interSubmitting = signal(false);
  stageMoving   = signal(false);

  // ── Computed: group by stage ──────────────────────────────────────
  columns = computed(() => {
    const all = this.opps();
    return PIPELINE_STAGES_ACTIVE.map(stage => ({
      stage,
      label: PIPELINE_STAGE_LABEL[stage],
      cards: all.filter(o => o.stage === stage),
    }));
  });

  wonCount  = computed(() => this.opps().filter(o => o.stage === 'WON').length);
  lostCount = computed(() => this.opps().filter(o => o.stage === 'LOST').length);
  total     = computed(() => this.opps().length);

  // ── Constants ────────────────────────────────────────────────────
  readonly STAGE_LABEL      = PIPELINE_STAGE_LABEL;
  readonly ALL_STAGES       = ALL_PIPELINE_STAGES;
  readonly ALL_INTER_TYPES  = ALL_INTERACTION_TYPES;
  readonly INTER_LABEL      = INTERACTION_TYPE_LABEL;

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      customers: this.svc.getCustomers().pipe(catchError(() => of([] as Customer[]))),
      opps:      this.svc.getAllOpportunities().pipe(catchError(() => of([] as Opportunity[]))),
    }).subscribe({
      next: ({ customers, opps }) => {
        const map = new Map(customers.map(c => [c.id, c.fullName]));
        this.customers.set(map);
        this.opps.set(opps.map(o => this.enrich(o, map)));
        this.loading.set(false);
      },
      error: _ => { this.error.set('No se pudo cargar el pipeline.'); this.loading.set(false); },
    });
  }

  private enrich(o: Opportunity, map: Map<string, string>): RichOpportunity {
    return {
      ...o,
      customerFullName: map.get(o.customerId) ?? 'Cliente desconocido',
      daysInStage: Math.floor((Date.now() - new Date(o.updatedAt).getTime()) / 86_400_000),
    };
  }

  // ── Select card ───────────────────────────────────────────────────
  selectCard(opp: RichOpportunity) {
    this.selected.set(opp);
    this.interactions.set([]);
    this.interForm = { type: 'NOTE', notes: '' };
    this.interLoading.set(true);
    this.svc.getInteractions(opp.id).subscribe({
      next:  is => { this.interactions.set(is); this.interLoading.set(false); },
      error: _  => this.interLoading.set(false),
    });
  }

  closeDetail() { this.selected.set(null); }

  // ── Move stage ────────────────────────────────────────────────────
  moveStage(stage: string) {
    const opp = this.selected();
    if (!opp || this.stageMoving()) return;
    this.stageMoving.set(true);
    this.svc.updateStage(opp.id, stage).subscribe({
      next: updated => {
        const rich = this.enrich(updated, this.customers());
        this.opps.update(list => list.map(o => o.id === rich.id ? rich : o));
        this.selected.set(rich);
        this.stageMoving.set(false);
      },
      error: _ => this.stageMoving.set(false),
    });
  }

  // ── Add interaction ───────────────────────────────────────────────
  submitInteraction() {
    const opp = this.selected();
    if (!opp || this.interSubmitting()) return;
    this.interSubmitting.set(true);
    this.svc.addInteraction(opp.id, {
      type:  this.interForm.type,
      notes: this.interForm.notes?.trim() || undefined,
    }).subscribe({
      next: inter => {
        this.interactions.update(list => [inter, ...list]);
        this.interForm = { type: 'NOTE', notes: '' };
        this.interSubmitting.set(false);
      },
      error: _ => this.interSubmitting.set(false),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  animIdx(i: number) { return Math.min(i, 5); }
}
