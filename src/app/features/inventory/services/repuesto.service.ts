import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  Repuesto,
  RepuestoCreateRequest,
  RepuestoUpdateRequest,
  StockLevelResponse,
} from '../models/repuesto.model';

@Injectable({ providedIn: 'root' })
export class RepuestoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/inventory/repuestos`;

  getAll()             { return this.http.get<Repuesto[]>(this.base); }
  getLowStock()        { return this.http.get<Repuesto[]>(`${this.base}/low-stock`); }
  getStock(id: string) { return this.http.get<StockLevelResponse[]>(`${this.base}/${id}/stock`); }

  create(body: RepuestoCreateRequest) {
    return this.http.post<Repuesto>(this.base, body);
  }

  update(id: string, body: RepuestoUpdateRequest) {
    return this.http.patch<Repuesto>(`${this.base}/${id}`, body);
  }

  adjustStock(id: string, warehouseId: string, quantityDelta: number, reason: string) {
    return this.http.post<void>(`${this.base}/${id}/stock/adjust`, {
      warehouseId,
      quantityDelta,
      reason,
    });
  }
}
