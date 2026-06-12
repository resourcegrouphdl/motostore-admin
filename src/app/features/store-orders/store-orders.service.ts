import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StoreOrder, StoreOrderStatus } from './store-orders.model';

@Injectable({ providedIn: 'root' })
export class StoreOrdersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/store-orders`;

  getAll(): Observable<StoreOrder[]> {
    return this.http.get<StoreOrder[]>(this.base);
  }

  getById(id: string): Observable<StoreOrder> {
    return this.http.get<StoreOrder>(`${this.base}/${id}`);
  }

  updateStatus(id: string, status: StoreOrderStatus): Observable<StoreOrder> {
    return this.http.patch<StoreOrder>(`${this.base}/${id}/status`, { status });
  }
}
