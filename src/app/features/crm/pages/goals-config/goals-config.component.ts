import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { CrmService } from '../../services/crm.service';
import { StaffService } from '../../../staff/services/staff.service';
import { SellerGoal, SellerGoalRequest } from '../../models/crm.model';
import { StaffMember } from '../../../staff/models/staff.model';

interface SellerRow {
  member:        StaffMember;
  goal:          SellerGoal | null;
  form: {
    targetUnits:    number;
    targetContacts: number;
    targetWinRate:  number;
    commissionRate: number;
    notes:          string;
  };
  saving:  boolean;
  saved:   boolean;
  saveErr: string;
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

@Component({
  selector: 'app-goals-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './goals-config.component.html',
  styleUrl:    './goals-config.component.scss',
})
export class GoalsConfigComponent implements OnInit {

  private crmSvc   = inject(CrmService);
  private staffSvc = inject(StaffService);

  period  = signal(currentPeriod());
  loading = signal(true);
  error   = signal('');
  rows    = signal<SellerRow[]>([]);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    const p = this.period();
    forkJoin({
      staff: this.staffSvc.getAll(),
      goals: this.crmSvc.getAllGoals(p),
    }).subscribe({
      next: ({ staff, goals }) => {
        const sellers = staff.filter(m => m.isActive && (m.role === 'SELLER' || m.role === 'ADVISOR'));
        const goalMap = new Map(goals.map(g => [g.sellerUid, g]));
        this.rows.set(sellers.map(member => {
          const goal = goalMap.get(member.firebaseUid) ?? null;
          return {
            member,
            goal,
            form: {
              targetUnits:    goal?.targetUnits    ?? 0,
              targetContacts: goal?.targetContacts ?? 0,
              targetWinRate:  goal?.targetWinRate  ?? 0,
              commissionRate: goal?.commissionRate ?? 3,
              notes:          goal?.notes          ?? '',
            },
            saving:  false,
            saved:   false,
            saveErr: '',
          };
        }));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el equipo o las metas.');
        this.loading.set(false);
      },
    });
  }

  onPeriodChange(value: string) {
    this.period.set(value);
    this.load();
  }

  save(row: SellerRow) {
    row.saving  = true;
    row.saved   = false;
    row.saveErr = '';
    const req: SellerGoalRequest = {
      targetUnits:    Number(row.form.targetUnits),
      targetContacts: Number(row.form.targetContacts),
      targetWinRate:  Number(row.form.targetWinRate),
      commissionRate: Number(row.form.commissionRate),
      notes:          row.form.notes || undefined,
    };
    this.crmSvc.saveGoal(row.member.firebaseUid, this.period(), req).subscribe({
      next: saved => {
        row.goal   = saved;
        row.saving = false;
        row.saved  = true;
        setTimeout(() => { row.saved = false; }, 2500);
      },
      error: () => {
        row.saving  = false;
        row.saveErr = 'Error al guardar.';
      },
    });
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  }

  avatarHue(uid: string): number {
    let h = 0;
    for (const c of uid) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
    return h % 360;
  }
}
