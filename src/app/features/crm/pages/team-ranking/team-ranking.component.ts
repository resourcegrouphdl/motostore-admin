import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { CrmService } from '../../services/crm.service';
import { TeamRankingEntry } from '../../models/crm.model';

@Component({
  selector: 'app-team-ranking',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './team-ranking.component.html',
  styleUrl:    './team-ranking.component.scss',
})
export class TeamRankingComponent implements OnInit {

  private crmSvc = inject(CrmService);

  loading = signal(true);
  error   = signal('');
  ranking = signal<TeamRankingEntry[]>([]);

  // ── KPIs derivados ────────────────────────────────────────────────
  topSeller = computed(() => this.ranking()[0] ?? null);

  totalWon = computed(() =>
    this.ranking().reduce((s, e) => s + e.wonCount, 0)
  );

  avgWinRate = computed(() => {
    const r = this.ranking();
    if (!r.length) return 0;
    const closed = r.reduce((s, e) => s + e.wonCount + e.lostCount, 0);
    const won    = r.reduce((s, e) => s + e.wonCount, 0);
    return closed > 0 ? Math.round(won / closed * 1000) / 10 : 0;
  });

  totalActive = computed(() =>
    this.ranking().reduce((s, e) => s + e.activeCount, 0)
  );

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit() {
    this.crmSvc.getTeamRanking().subscribe({
      next: data => { this.ranking.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar el ranking.'); this.loading.set(false); },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  medal(i: number): string {
    return ['🥇', '🥈', '🥉'][i] ?? '';
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  }

  avatarHue(uid: string): number {
    let h = 0;
    for (const c of uid) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
    return h % 360;
  }

  animIdx(i: number) { return Math.min(i, 7); }
}
