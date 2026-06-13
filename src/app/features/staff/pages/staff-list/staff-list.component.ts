import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { StaffService } from '../../services/staff.service';
import { StaffMember, ROLE_LABELS } from '../../models/staff.model';
import { StaffFormDialogComponent } from '../../components/staff-form-dialog/staff-form-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDialogModule, MatSnackBarModule, MatMenuModule,
    MatProgressBarModule, MatTooltipModule, MatBadgeModule,
  ],
  templateUrl: './staff-list.component.html',
})
export class StaffListComponent implements OnInit {
  private staffService = inject(StaffService);
  private authService  = inject(AuthService);
  private dialog       = inject(MatDialog);
  private snackBar     = inject(MatSnackBar);

  staffList    = signal<StaffMember[]>([]);
  currentStaff = signal<StaffMember | null>(null);
  loading      = signal(false);
  error        = signal('');

  isManager  = computed(() => this.currentStaff()?.role === 'MANAGER');
  activeCount = computed(() => this.staffList().filter(s => s.isActive).length);

  displayedColumns = ['fullName', 'email', 'role', 'lastLoginAt', 'actions'];
  roleLabels = ROLE_LABELS;

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    forkJoin({ list: this.staffService.getAll(), me: this.staffService.getMe() })
      .subscribe({
        next: ({ list, me }) => {
          this.staffList.set(list);
          this.currentStaff.set(me);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el personal. ¿Estás registrado como staff en este tenant?');
          this.loading.set(false);
        }
      });
  }

  openCreate() {
    const ref = this.dialog.open(StaffFormDialogComponent, {
      width: '440px',
      data: {}
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.staffList.update(list => [...list, result]);
        this.snackBar.open(`${result.fullName} registrado correctamente`, 'OK', { duration: 3000 });
      }
    });
  }

  openEdit(staff: StaffMember) {
    const ref = this.dialog.open(StaffFormDialogComponent, {
      width: '440px',
      data: { staff }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.staffList.update(list => list.map(s => s.id === result.id ? result : s));
        this.snackBar.open('Datos actualizados', 'OK', { duration: 3000 });
      }
    });
  }

  deactivate(staff: StaffMember) {
    this.staffService.deactivate(staff.id).subscribe({
      next: () => {
        this.staffList.update(list => list.filter(s => s.id !== staff.id));
        this.snackBar.open(`${staff.fullName} desactivado`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        const msg = err.error?.message ?? 'No se pudo desactivar el staff.';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }

  sendInvitation(staff: StaffMember) {
    this.authService.sendPasswordReset(staff.email)
      .then(() => {
        this.snackBar.open(`Correo de acceso enviado a ${staff.email}`, 'OK', { duration: 4000 });
      })
      .catch(() => {
        this.snackBar.open('No se pudo enviar el correo. Intenta de nuevo.', 'Cerrar', { duration: 4000 });
      });
  }

  isSelf(staff: StaffMember) {
    return staff.firebaseUid === this.currentStaff()?.firebaseUid;
  }

  getRoleLabel(role: string): string {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
  }

  isManagerRole(role: string): boolean {
    return role === 'MANAGER';
  }

  isAccentRole(role: string): boolean {
    return role === 'SELLER' || role === 'ADVISOR';
  }
}
