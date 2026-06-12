import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { RepuestoService }  from '../../services/repuesto.service';
import { WarehouseService } from '../../services/warehouse.service';
import {
  ALL_CATEGORIES, ALL_UOM,
  CATEGORY_COLOR, CATEGORY_FILTER_OPTIONS, CATEGORY_LABEL,
  CategoryFilterOption,
  Repuesto, RepuestoCategory, RepuestoCreateRequest, RepuestoUpdateRequest,
  StockLevelResponse, UnitOfMeasure, UOM_LABEL,
} from '../../models/repuesto.model';

// Client-side view model that enriches a StockLevelResponse with the warehouse name
interface StockLevelView extends StockLevelResponse {
  warehouseName: string;
}

@Component({
  selector: 'app-repuesto-list',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  templateUrl: './repuesto-list.component.html',
  styleUrl:    './repuesto-list.component.scss',
})
export class RepuestoListComponent implements OnInit {

  private repuestoSvc  = inject(RepuestoService);
  private warehouseSvc = inject(WarehouseService);

  // ── Dialog element refs ──────────────────────────────────────────
  private createDialogEl = viewChild<ElementRef<HTMLDialogElement>>('createDialog');
  private adjustDialogEl = viewChild<ElementRef<HTMLDialogElement>>('adjustDialog');
  private editDialogEl   = viewChild<ElementRef<HTMLDialogElement>>('editDialog');

  // ── Core state ───────────────────────────────────────────────────
  loading    = signal(true);
  error      = signal('');
  repuestos  = signal<Repuesto[]>([]);
  lowStockIds  = signal(new Set<string>());
  warehouseMap = signal(new Map<string, string>()); // id → display name

  // ── Filter state ─────────────────────────────────────────────────
  selectedCategory = signal<RepuestoCategory | null>(null);
  showLowStockOnly = signal(false);

  // ── Row expansion ────────────────────────────────────────────────
  expandedId           = signal<string | null>(null);
  expandedStock        = signal<StockLevelView[]>([]);
  expandedStockLoading = signal(false);

  // ── Create form ──────────────────────────────────────────────────
  createForm: RepuestoCreateRequest = this.emptyCreateForm();
  createSubmitting = signal(false);
  createError      = signal('');

  // ── Edit repuesto form ───────────────────────────────────────────
  editTarget      = signal<Repuesto | null>(null);
  editForm: RepuestoUpdateRequest & { name: string; category: RepuestoCategory; unitOfMeasure: UnitOfMeasure } = this.emptyEditForm();
  editSubmitting  = signal(false);
  editError       = signal('');

  // ── Adjust stock form ────────────────────────────────────────────
  adjustTarget     = signal<Repuesto | null>(null);
  adjustForm       = { warehouseId: '', quantityDelta: 0, reason: '' };
  adjustSubmitting = signal(false);
  adjustError      = signal('');

  // ── Computed ─────────────────────────────────────────────────────
  filteredRepuestos = computed(() => {
    let list = this.repuestos();
    if (this.selectedCategory()) list = list.filter(r => r.category === this.selectedCategory());
    if (this.showLowStockOnly()) list = list.filter(r => this.lowStockIds().has(r.id));
    return list;
  });

  totalCount    = computed(() => this.repuestos().length);
  lowStockCount = computed(() => this.lowStockIds().size);

  // Warehouse list for selects (derived from warehouseMap)
  warehouseList = computed(() =>
    Array.from(this.warehouseMap().entries()).map(([id, name]) => ({ id, name }))
  );

  // ── Exposed constants ────────────────────────────────────────────
  readonly CATEGORY_FILTER_OPTIONS = CATEGORY_FILTER_OPTIONS;
  readonly CATEGORY_LABEL          = CATEGORY_LABEL;
  readonly CATEGORY_COLOR          = CATEGORY_COLOR;
  readonly UOM_LABEL               = UOM_LABEL;
  readonly ALL_CATEGORIES          = ALL_CATEGORIES;
  readonly ALL_UOM                 = ALL_UOM;

  // ── Helpers ──────────────────────────────────────────────────────
  /** Clamp stagger index — Emil: keep it under 8 rows (200ms max stagger) */
  animIdx(i: number) { return Math.min(i, 7); }

  isLowStock(r: Repuesto) { return this.lowStockIds().has(r.id); }

  trackById(_: number, r: Repuesto) { return r.id; }

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      repuestos:  this.repuestoSvc.getAll(),
      lowStock:   this.repuestoSvc.getLowStock(),
      warehouses: this.warehouseSvc.getAll(),
    }).subscribe({
      next: ({ repuestos, lowStock, warehouses }) => {
        this.repuestos.set(repuestos);
        this.lowStockIds.set(new Set(lowStock.map(r => r.id)));

        const map = new Map<string, string>();
        warehouses.forEach(w => map.set(w.id, w.name));
        this.warehouseMap.set(map);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el inventario de repuestos.');
        this.loading.set(false);
      },
    });
  }

  // ── Filter handlers ──────────────────────────────────────────────
  selectCategory(cat: RepuestoCategory | null) { this.selectedCategory.set(cat); }

  toggleLowStockFilter() {
    this.showLowStockOnly.update(v => !v);
    if (this.showLowStockOnly()) this.selectedCategory.set(null);
  }

  // ── Row expansion ────────────────────────────────────────────────
  toggleExpand(repuesto: Repuesto) {
    if (this.expandedId() === repuesto.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(repuesto.id);
    this.expandedStock.set([]);
    this.expandedStockLoading.set(true);

    this.repuestoSvc.getStock(repuesto.id).subscribe({
      next: levels => {
        this.expandedStock.set(
          levels.map(l => ({
            ...l,
            warehouseName: this.warehouseMap().get(l.warehouseId) ?? 'Almacén ' + l.warehouseId.slice(0, 6),
          }))
        );
        this.expandedStockLoading.set(false);
      },
      error: () => { this.expandedStockLoading.set(false); },
    });
  }

  // ── Create dialog ─────────────────────────────────────────────────
  openCreate() {
    this.createForm  = this.emptyCreateForm();
    this.createError.set('');
    this.createDialogEl()?.nativeElement.showModal();
  }

  closeCreate() { this.createDialogEl()?.nativeElement.close(); }

  submitCreate() {
    if (!this.createForm.sku || !this.createForm.name || !this.createForm.category) return;
    this.createSubmitting.set(true);
    this.createError.set('');

    const body: RepuestoCreateRequest = {
      ...this.createForm,
      description:       this.createForm.description       || undefined,
      brand:             this.createForm.brand             || undefined,
      listPrice:         this.createForm.listPrice         ?? undefined,
      costPrice:         this.createForm.costPrice         ?? undefined,
      initialWarehouseId: this.createForm.initialWarehouseId || undefined,
    };

    this.repuestoSvc.create(body).subscribe({
      next: created => {
        this.repuestos.update(list => [created, ...list]);
        this.closeCreate();
        this.createSubmitting.set(false);
      },
      error: err => {
        this.createError.set(err.error?.detail ?? 'Error al registrar el repuesto.');
        this.createSubmitting.set(false);
      },
    });
  }

  // ── Edit repuesto dialog ──────────────────────────────────────────
  openEdit(repuesto: Repuesto) {
    this.editTarget.set(repuesto);
    this.editForm = {
      name:         repuesto.name,
      description:  repuesto.description ?? '',
      category:     repuesto.category,
      brand:        repuesto.brand ?? '',
      unitOfMeasure: repuesto.unitOfMeasure,
      listPrice:    repuesto.listPrice ?? undefined,
      costPrice:    repuesto.costPrice ?? undefined,
      minimumStock: repuesto.minimumStock,
      active:       repuesto.active,
    };
    this.editError.set('');
    this.editDialogEl()?.nativeElement.showModal();
  }

  closeEdit() { this.editDialogEl()?.nativeElement.close(); }

  submitEdit() {
    const target = this.editTarget();
    if (!target || !this.editForm.name || !this.editForm.category) return;
    this.editSubmitting.set(true);
    this.editError.set('');

    const body: RepuestoUpdateRequest = {
      name:         this.editForm.name,
      description:  this.editForm.description  || undefined,
      category:     this.editForm.category,
      brand:        this.editForm.brand        || undefined,
      unitOfMeasure: this.editForm.unitOfMeasure,
      listPrice:    this.editForm.listPrice    ?? undefined,
      costPrice:    this.editForm.costPrice    ?? undefined,
      minimumStock: this.editForm.minimumStock,
      active:       this.editForm.active,
    };

    this.repuestoSvc.update(target.id, body).subscribe({
      next: updated => {
        this.repuestos.update(list => list.map(r => r.id === updated.id ? updated : r));
        this.closeEdit();
        this.editSubmitting.set(false);
      },
      error: err => {
        this.editError.set(err.error?.detail ?? 'Error al guardar los cambios.');
        this.editSubmitting.set(false);
      },
    });
  }

  // ── Adjust stock dialog ───────────────────────────────────────────
  openAdjust(repuesto: Repuesto) {
    this.adjustTarget.set(repuesto);
    this.adjustForm = { warehouseId: '', quantityDelta: 0, reason: '' };
    this.adjustError.set('');
    this.adjustDialogEl()?.nativeElement.showModal();
  }

  closeAdjust() { this.adjustDialogEl()?.nativeElement.close(); }

  submitAdjust() {
    const target = this.adjustTarget();
    if (!target || !this.adjustForm.warehouseId || !this.adjustForm.reason.trim() || this.adjustForm.quantityDelta === 0) return;

    this.adjustSubmitting.set(true);
    this.adjustError.set('');

    this.repuestoSvc.adjustStock(
      target.id,
      this.adjustForm.warehouseId,
      this.adjustForm.quantityDelta,
      this.adjustForm.reason,
    ).subscribe({
      next: () => {
        this.adjustSubmitting.set(false);
        this.closeAdjust();
        // Reload expanded stock if this repuesto is currently expanded
        if (this.expandedId() === target.id) {
          this.expandedId.set(null);
          this.toggleExpand(target);
        }
      },
      error: err => {
        this.adjustError.set(err.error?.detail ?? 'Error al ajustar el stock.');
        this.adjustSubmitting.set(false);
      },
    });
  }

  // ── Private ───────────────────────────────────────────────────────
  private emptyCreateForm(): RepuestoCreateRequest {
    return {
      sku: '', name: '', description: '', category: '' as RepuestoCategory,
      brand: '', unitOfMeasure: 'UNIT', listPrice: undefined, costPrice: undefined,
      minimumStock: 0, initialWarehouseId: undefined, initialStock: 0,
    };
  }

  private emptyEditForm() {
    return {
      name: '', description: '', category: '' as RepuestoCategory,
      brand: '', unitOfMeasure: 'UNIT' as UnitOfMeasure,
      listPrice: undefined as number | undefined,
      costPrice: undefined as number | undefined,
      minimumStock: 0, active: true,
    };
  }
}
