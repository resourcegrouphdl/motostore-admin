import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { StaffService } from '../../services/staff.service';
import { StaffMember, StaffRole, ALL_ROLES, ROLE_LABELS } from '../../models/staff.model';

interface DialogData { staff?: StaffMember; }

@Component({
  selector: 'app-staff-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  templateUrl: './staff-form-dialog.component.html',
})
export class StaffFormDialogComponent {
  private dialogRef    = inject(MatDialogRef<StaffFormDialogComponent>);
  private data         = inject<DialogData>(MAT_DIALOG_DATA);
  private staffService = inject(StaffService);

  isEditMode = !!this.data?.staff;
  allRoles   = ALL_ROLES;
  roleLabels = ROLE_LABELS;

  form = new FormGroup({
    email:    new FormControl(
      { value: this.data?.staff?.email ?? '', disabled: this.isEditMode },
      this.isEditMode ? [] : [Validators.required, Validators.email]
    ),
    fullName: new FormControl(
      this.data?.staff?.fullName ?? '',
      [Validators.required, Validators.maxLength(200)]
    ),
    role: new FormControl<StaffRole>(
      this.data?.staff?.role ?? 'SELLER',
      Validators.required
    ),
  });

  loading = signal(false);
  error   = signal('');

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const obs = this.isEditMode
      ? this.staffService.update(this.data.staff!.id, {
          fullName: this.form.value.fullName ?? undefined,
          role:     this.form.value.role ?? undefined,
        })
      : this.staffService.create({
          email:    this.form.value.email!,
          fullName: this.form.value.fullName!,
          role:     this.form.value.role!,
        });

    obs.subscribe({
      next:  result => { this.loading.set(false); this.dialogRef.close(result); },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Ocurrió un error. Intenta de nuevo.');
      },
    });
  }

  cancel() { this.dialogRef.close(); }
}
