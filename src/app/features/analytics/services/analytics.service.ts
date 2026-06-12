import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AnalyticsPeriod, CollectionAnalytics, CreditAnalytics, CustomerAnalytics,
  InventoryAnalytics, SalesAnalytics, WorkshopAnalytics,
} from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/analytics`;

  getSales(period: AnalyticsPeriod): Observable<SalesAnalytics> {
    return this.http.get<SalesAnalytics>(`${this.base}/sales?period=${period}`);
  }

  getInventory(period: AnalyticsPeriod): Observable<InventoryAnalytics> {
    return this.http.get<InventoryAnalytics>(`${this.base}/inventory?period=${period}`);
  }

  getCredit(period: AnalyticsPeriod): Observable<CreditAnalytics> {
    return this.http.get<CreditAnalytics>(`${this.base}/credit?period=${period}`);
  }

  getCustomers(period: AnalyticsPeriod): Observable<CustomerAnalytics> {
    return this.http.get<CustomerAnalytics>(`${this.base}/customers?period=${period}`);
  }

  getCollection(period: AnalyticsPeriod): Observable<CollectionAnalytics> {
    return this.http.get<CollectionAnalytics>(`${this.base}/collection?period=${period}`);
  }

  getWorkshop(period: AnalyticsPeriod): Observable<WorkshopAnalytics> {
    return this.http.get<WorkshopAnalytics>(`${this.base}/workshop?period=${period}`);
  }
}
