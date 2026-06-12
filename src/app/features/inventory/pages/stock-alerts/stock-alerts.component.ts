import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { RepuestoService }  from '../../services/repuesto.service';
import { WarehouseService } from '../../services/warehouse.service';
import {
  CATEGORY_COLOR, CATEGORY_FILTER_OPTIONS, CATEGORY_LABEL,
  Repuesto, RepuestoCategory, StockLevelResponse, UOM_LABEL,
} from '../../models/repuesto.model';

interface AlertItem {
  repuesto: Repuesto;
  stock: StockLevelResponse[];
  totalAvailable: number;
}

@Component({
  selector: 'app-stock-alerts',
  standalone: true,
  imports: [],
  templateUrl: './stock-alerts.component.html',
  styleUrl: './stock-alerts.component.scss',
})
export class StockAlertsComponent implements OnInit {
  private repuestoSvc  = inject(RepuestoService);
  private warehouseSvc = inject(WarehouseService);

  loading      = signal(true);
  error        = signal('');
  alerts       = signal<AlertItem[]>([]);
  warehouseMap = signal(new Map<string, string>());
  selectedCat  = signal<RepuestoCategory | null>(null);

  filtered = computed(() => {
    const cat = this.selectedCat();
    return cat ? this.alerts().filter(a => a.repuesto.category === cat) : this.alerts();
  });

  totalAffected   = computed(() => this.alerts().length);
  criticalCount   = computed(() => this.alerts().filter(a => a.totalAvailable === 0).length);
  categoriesCount = computed(() => new Set(this.alerts().map(a => a.repuesto.category)).size);

  readonly CATEGORY_FILTER_OPTIONS = CATEGORY_FILTER_OPTIONS;
  readonly CATEGORY_LABEL          = CATEGORY_LABEL;
  readonly CATEGORY_COLOR          = CATEGORY_COLOR;
  readonly UOM_LABEL               = UOM_LABEL;

  animIdx(i: number) { return Math.min(i, 7); }

  ngOnInit() {
    forkJoin({
      lowStock:   this.repuestoSvc.getLowStock(),
      warehouses: this.warehouseSvc.getAll(),
    }).pipe(
      switchMap(({ lowStock, warehouses }) => {
        const map = new Map<string, string>();
        warehouses.forEach(w => map.set(w.id, w.name));
        this.warehouseMap.set(map);

        if (lowStock.length === 0) return of([] as AlertItem[]);

        const stockCalls = lowStock.map(r =>
          this.repuestoSvc.getStock(r.id).pipe(
            catchError(() => of([] as StockLevelResponse[]))
          )
        );

        return forkJoin(stockCalls).pipe(
          switchMap(allStock => of(
            lowStock.map((r, i) => ({
              repuesto: r,
              stock: allStock[i],
              totalAvailable: allStock[i].reduce((sum, s) => sum + s.quantityAvailable, 0),
            } as AlertItem))
          ))
        );
      })
    ).subscribe({
      next: items => {
        this.alerts.set(items.sort((a, b) => a.totalAvailable - b.totalAvailable));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las alertas de stock.');
        this.loading.set(false);
      },
    });
  }

  selectCat(cat: RepuestoCategory | null) { this.selectedCat.set(cat); }

  shortage(item: AlertItem) {
    return Math.max(0, item.repuesto.minimumStock - item.totalAvailable);
  }

  severityClass(item: AlertItem): string {
    if (item.totalAvailable === 0) return 'critical';
    if (item.totalAvailable < item.repuesto.minimumStock * 0.5) return 'high';
    return 'medium';
  }
}
