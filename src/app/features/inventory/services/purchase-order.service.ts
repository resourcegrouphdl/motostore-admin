import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  PurchaseOrder,
  PurchaseOrderCreateRequest,
  PurchaseOrderStatus,
  ReceiveStockRequest,
} from '../models/purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private http    = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/inventory/purchase-orders`;

  getAll(status?: PurchaseOrderStatus | null) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<PurchaseOrder[]>(this.baseUrl, { params });
  }

  getById(id: string) { return this.http.get<PurchaseOrder>(`${this.baseUrl}/${id}`); }

  create(body: PurchaseOrderCreateRequest) {
    return this.http.post<PurchaseOrder>(this.baseUrl, body);
  }

  send(id: string)   { return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/send`, {}); }

  cancel(id: string) { return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/cancel`, {}); }

  receive(id: string, body: ReceiveStockRequest) {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/receive`, body);
  }
}
