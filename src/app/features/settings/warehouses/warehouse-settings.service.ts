import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  Warehouse, WarehouseCreateRequest, WarehouseUpdateRequest,
} from './warehouse-settings.model';

@Injectable({ providedIn: 'root' })
export class WarehouseSettingsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/inventory/warehouses`;

  getAll()             { return this.http.get<Warehouse[]>(this.base); }
  create(b: WarehouseCreateRequest) { return this.http.post<Warehouse>(this.base, b); }
  update(id: string, b: WarehouseUpdateRequest) {
    return this.http.patch<Warehouse>(`${this.base}/${id}`, b);
  }
}
