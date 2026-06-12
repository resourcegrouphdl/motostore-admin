import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WarehouseSettingsService } from './warehouse-settings.service';
import {
  ALL_WAREHOUSE_TYPES,
  Warehouse,
  WarehouseCreateRequest,
  WarehouseType,
  WAREHOUSE_TYPE_COLOR,
  WAREHOUSE_TYPE_LABEL,
} from './warehouse-settings.model';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './warehouses.component.html',
  styleUrl:    './warehouses.component.scss',
})
export class WarehousesComponent implements OnInit {

  private svc = inject(WarehouseSettingsService);

  // ── State ────────────────────────────────────────────────────────
  loading    = signal(true);
  error      = signal('');
  warehouses = signal<Warehouse[]>([]);

  // ── Create dialog ────────────────────────────────────────────────
  createOpen       = signal(false);
  createSubmitting = signal(false);
  createError      = signal('');
  createForm: WarehouseCreateRequest = this.emptyCreate();

  // ── Edit dialog ──────────────────────────────────────────────────
  editTarget     = signal<Warehouse | null>(null);
  editSubmitting = signal(false);
  editError      = signal('');
  editForm       = { name: '', type: 'MAIN' as WarehouseType, address: '', publicFacing: false, active: true };

  // ── Computed ─────────────────────────────────────────────────────
  activeCount    = computed(() => this.warehouses().filter(w => w.active).length);
  showroomCount  = computed(() => this.warehouses().filter(w => w.type === 'SHOWROOM').length);

  // ── Constants ────────────────────────────────────────────────────
  readonly TYPE_LABEL  = WAREHOUSE_TYPE_LABEL;
  readonly TYPE_COLOR  = WAREHOUSE_TYPE_COLOR;
  readonly ALL_TYPES   = ALL_WAREHOUSE_TYPES;

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next:  ws => { this.warehouses.set(ws); this.loading.set(false); },
      error: _  => { this.error.set('No se pudieron cargar los almacenes.'); this.loading.set(false); },
    });
  }

  // ── Create ───────────────────────────────────────────────────────
  openCreate() {
    this.createForm = this.emptyCreate();
    this.createError.set('');
    this.createOpen.set(true);
  }

  closeCreate() { this.createOpen.set(false); }

  submitCreate() {
    this.createError.set('');
    this.createSubmitting.set(true);
    const payload: WarehouseCreateRequest = {
      ...this.createForm,
      code:    this.createForm.code.trim().toUpperCase(),
      name:    this.createForm.name.trim(),
      address: this.createForm.address?.trim() || undefined,
    };
    this.svc.create(payload).subscribe({
      next: w => {
        this.warehouses.update(list => [...list, w]);
        this.createSubmitting.set(false);
        this.closeCreate();
      },
      error: err => {
        this.createError.set(err?.error?.message ?? 'Error al crear el almacén.');
        this.createSubmitting.set(false);
      },
    });
  }

  // ── Edit ─────────────────────────────────────────────────────────
  openEdit(w: Warehouse) {
    this.editForm = { name: w.name, type: w.type, address: w.address ?? '', publicFacing: w.publicFacing, active: w.active };
    this.editError.set('');
    this.editTarget.set(w);
  }

  closeEdit() { this.editTarget.set(null); }

  submitEdit() {
    const target = this.editTarget();
    if (!target) return;
    this.editError.set('');
    this.editSubmitting.set(true);
    this.svc.update(target.id, {
      name:        this.editForm.name.trim(),
      type:        this.editForm.type,
      address:     this.editForm.address.trim() || undefined,
      publicFacing: this.editForm.publicFacing,
      active:      this.editForm.active,
    }).subscribe({
      next: updated => {
        this.warehouses.update(list => list.map(w => w.id === updated.id ? updated : w));
        this.editSubmitting.set(false);
        this.closeEdit();
      },
      error: err => {
        this.editError.set(err?.error?.message ?? 'Error al actualizar.');
        this.editSubmitting.set(false);
      },
    });
  }

  toggleActive(w: Warehouse) {
    this.svc.update(w.id, { active: !w.active }).subscribe({
      next: updated => this.warehouses.update(list => list.map(x => x.id === updated.id ? updated : x)),
    });
  }

  animIdx(i: number) { return Math.min(i, 7); }

  private emptyCreate(): WarehouseCreateRequest {
    return { code: '', name: '', type: 'MAIN', address: '', publicFacing: false };
  }
}
