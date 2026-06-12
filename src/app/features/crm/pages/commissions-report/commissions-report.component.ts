import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CrmService } from '../../services/crm.service';
import { CommissionEntry } from '../../models/crm.model';

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

@Component({
  selector: 'app-commissions-report',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  templateUrl: './commissions-report.component.html',
  styleUrl:    './commissions-report.component.scss',
})
export class CommissionsReportComponent implements OnInit {

  private crmSvc = inject(CrmService);

  period  = signal(currentPeriod());
  loading = signal(true);
  error   = signal('');
  entries = signal<CommissionEntry[]>([]);

  // ── KPIs ──────────────────────────────────────────────────────────
  totalSales       = computed(() => this.entries().reduce((s, e) => s + e.totalSales, 0));
  totalCommissions = computed(() => this.entries().reduce((s, e) => s + e.commissionAmount, 0));
  totalWon         = computed(() => this.entries().reduce((s, e) => s + e.wonCount, 0));
  topSeller        = computed(() =>
    this.entries().length > 0 ? this.entries()[0] : null
  );

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.crmSvc.getCommissions(this.period()).subscribe({
      next: data => { this.entries.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar el reporte.'); this.loading.set(false); },
    });
  }

  onPeriodChange(value: string) {
    this.period.set(value);
    this.load();
  }

  // ── Helpers ───────────────────────────────────────────────────────
  initials(name: string): string {
    return name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  }

  avatarHue(uid: string): number {
    let h = 0;
    for (const c of uid) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
    return h % 360;
  }

  /** Width % for the horizontal sales bar relative to team max */
  barWidth(entry: CommissionEntry): number {
    const max = this.entries()[0]?.totalSales ?? 0;
    return max > 0 ? Math.round(entry.totalSales / max * 100) : 0;
  }

  roleLabel(role: string): string {
    return role === 'ADVISOR' ? 'Asesor' : 'Vendedor';
  }
}
