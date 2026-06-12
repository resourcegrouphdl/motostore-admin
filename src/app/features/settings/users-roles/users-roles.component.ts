import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StaffService } from '../../staff/services/staff.service';
import {
  ALL_ROLES, ROLE_LABELS, StaffMember, StaffRole,
} from '../../staff/models/staff.model';

@Component({
  selector: 'app-users-roles',
  standalone: true,
  imports: [DatePipe, NgClass, FormsModule],
  templateUrl: './users-roles.component.html',
  styleUrl:    './users-roles.component.scss',
})
export class UsersRolesComponent implements OnInit {

  private staffSvc = inject(StaffService);

  loading  = signal(true);
  error    = signal('');
  members  = signal<StaffMember[]>([]);
  me       = signal<StaffMember | null>(null);

  activeCount = computed(() => this.members().filter(m => m.isActive).length);

  // ── Inline role update ────────────────────────────────────────────
  updatingId  = signal<string | null>(null);
  updateError = signal('');

  // ── Invite dialog ─────────────────────────────────────────────────
  inviteOpen       = signal(false);
  inviteSubmitting = signal(false);
  inviteError      = signal('');
  inviteForm = { email: '', fullName: '', role: 'SELLER' as StaffRole };

  // ── Deactivate confirm ────────────────────────────────────────────
  confirmDeactivateId = signal<string | null>(null);

  // ── Constants ─────────────────────────────────────────────────────
  readonly ROLE_LABELS = ROLE_LABELS;
  readonly ALL_ROLES   = ALL_ROLES;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.staffSvc.getAll().subscribe({
      next: list => { this.members.set(list); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el equipo.'); this.loading.set(false); },
    });
    this.staffSvc.getMe().subscribe({
      next: me => this.me.set(me),
    });
  }

  isMe(m: StaffMember) {
    return m.firebaseUid === this.me()?.firebaseUid;
  }

  isManager() {
    return this.me()?.role === 'MANAGER';
  }

  changeRole(member: StaffMember, role: StaffRole) {
    if (member.role === role) return;
    this.updatingId.set(member.id);
    this.updateError.set('');
    this.staffSvc.update(member.id, { role }).subscribe({
      next: updated => {
        this.members.update(list => list.map(m => m.id === updated.id ? updated : m));
        this.updatingId.set(null);
      },
      error: err => {
        this.updateError.set(err?.error?.message ?? 'Error al cambiar el rol.');
        this.updatingId.set(null);
      },
    });
  }

  requestDeactivate(id: string) { this.confirmDeactivateId.set(id); }
  cancelDeactivate()            { this.confirmDeactivateId.set(null); }

  confirmDeactivate() {
    const id = this.confirmDeactivateId();
    if (!id) return;
    this.updatingId.set(id);
    this.staffSvc.deactivate(id).subscribe({
      next: () => {
        this.members.update(list => list.filter(m => m.id !== id));
        this.confirmDeactivateId.set(null);
        this.updatingId.set(null);
      },
      error: err => {
        this.updateError.set(err?.error?.message ?? 'No se pudo desactivar.');
        this.confirmDeactivateId.set(null);
        this.updatingId.set(null);
      },
    });
  }

  openInvite() {
    this.inviteForm = { email: '', fullName: '', role: 'SELLER' };
    this.inviteError.set('');
    this.inviteOpen.set(true);
  }
  closeInvite() { this.inviteOpen.set(false); }

  // ── Avatar helpers ───────────────────────────────────────────────
  initials(name: string) {
    return name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  }
  hue(uid: string) {
    let h = 0;
    for (const c of uid) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
    return h % 360;
  }

  submitInvite() {
    this.inviteError.set('');
    this.inviteSubmitting.set(true);
    this.staffSvc.create(this.inviteForm).subscribe({
      next: member => {
        this.members.update(list => [...list, member]);
        this.inviteSubmitting.set(false);
        this.closeInvite();
      },
      error: err => {
        this.inviteError.set(err?.error?.message ?? 'Error al invitar el usuario.');
        this.inviteSubmitting.set(false);
      },
    });
  }
}
