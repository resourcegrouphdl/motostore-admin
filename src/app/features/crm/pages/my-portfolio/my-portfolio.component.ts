import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

import { CrmService } from '../../services/crm.service';
import { Opportunity, SellerGoal, PIPELINE_STAGE_LABEL, PIPELINE_STAGES_ACTIVE } from '../../models/crm.model';

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

@Component({
  selector: 'app-my-portfolio',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  templateUrl: './my-portfolio.component.html',
  styleUrl:    './my-portfolio.component.scss',
})
export class MyPortfolioComponent implements OnInit {

  private crmSvc = inject(CrmService);

  loading  = signal(true);
  error    = signal('');
  opps     = signal<Opportunity[]>([]);
  goal     = signal<SellerGoal | null>(null);
  advancing = signal<string | null>(null);

  readonly period = currentPeriod();
  readonly STAGE_LABEL = PIPELINE_STAGE_LABEL;
  readonly ACTIVE_STAGES = PIPELINE_STAGES_ACTIVE;

  // ── KPIs ──────────────────────────────────────────────────────────
  activeOpps = computed(() => this.opps().filter(o => this.ACTIVE_STAGES.includes(o.stage as any)));

  wonThisMonth = computed(() => {
    const [y, m] = this.period.split('-').map(Number);
    return this.opps().filter(o => {
      if (o.stage !== 'WON' || !o.wonAt) return false;
      const d = new Date(o.wonAt);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  });

  lostThisMonth = computed(() => {
    const [y, m] = this.period.split('-').map(Number);
    return this.opps().filter(o => {
      if (o.stage !== 'LOST' || !o.lostAt) return false;
      const d = new Date(o.lostAt);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  });

  winRate = computed(() => {
    const won  = this.wonThisMonth().length;
    const lost = this.lostThisMonth().length;
    const total = won + lost;
    return total > 0 ? Math.round(won / total * 1000) / 10 : 0;
  });

  // ── Goal progress ─────────────────────────────────────────────────
  goalUnitsProgress = computed(() => {
    const g = this.goal();
    if (!g || g.targetUnits === 0) return null;
    return Math.min(this.wonThisMonth().length / g.targetUnits * 100, 100);
  });

  goalContactsProgress = computed(() => {
    const g = this.goal();
    if (!g || g.targetContacts === 0) return null;
    return null; // contacts not tracked at opp level — display target only
  });

  goalWinRateProgress = computed(() => {
    const g = this.goal();
    if (!g || g.targetWinRate === 0) return null;
    return Math.min(this.winRate() / Number(g.targetWinRate) * 100, 100);
  });

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      opps: this.crmSvc.getMyOpportunities(),
      goal: this.crmSvc.getMyGoal(this.period),
    }).subscribe({
      next: ({ opps, goal }) => {
        this.opps.set(opps);
        this.goal.set(goal);
        this.loading.set(false);
      },
      error: (err) => {
        // goal 404 is acceptable — load opps alone
        this.crmSvc.getMyOpportunities().subscribe({
          next: opps => { this.opps.set(opps); this.loading.set(false); },
          error: () => { this.error.set('Error al cargar tu portafolio.'); this.loading.set(false); },
        });
      },
    });
  }

  // ── Actions ───────────────────────────────────────────────────────
  advance(opp: Opportunity) {
    const stages = this.ACTIVE_STAGES;
    const idx    = stages.indexOf(opp.stage as any);
    if (idx < 0 || idx >= stages.length - 1) return;
    const next = stages[idx + 1];
    this.advancing.set(opp.id);
    this.crmSvc.updateStage(opp.id, next).subscribe({
      next: updated => {
        this.opps.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.advancing.set(null);
      },
      error: () => this.advancing.set(null),
    });
  }

  canAdvance(opp: Opportunity): boolean {
    return this.ACTIVE_STAGES.indexOf(opp.stage as any) < this.ACTIVE_STAGES.length - 1;
  }

  stageLabel(stage: string): string {
    return this.STAGE_LABEL[stage as keyof typeof PIPELINE_STAGE_LABEL] ?? stage;
  }

  stageClass(stage: string): string {
    const map: Record<string, string> = {
      NEW:            'stage--new',
      CONTACTED:      'stage--contacted',
      DEMO_SCHEDULED: 'stage--demo',
      DEMO_DONE:      'stage--demo',
      PROPOSAL_SENT:  'stage--proposal',
      NEGOTIATION:    'stage--negotiation',
      WON:            'stage--won',
      LOST:           'stage--lost',
    };
    return map[stage] ?? '';
  }
}
