import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Warehouse } from '../models/warehouse.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/inventory/warehouses`;

  getAll() { return this.http.get<Warehouse[]>(this.base); }
}
