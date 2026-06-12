import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CreateSaleRequest, Delivery, DeliveryRequest, Sale } from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/sales`;

  getAll()                       { return this.http.get<Sale[]>(this.base); }
  getMine()                      { return this.http.get<Sale[]>(`${this.base}/mine`); }
  getByCustomer(customerId: string) { return this.http.get<Sale[]>(`${this.base}/customer/${customerId}`); }
  getById(id: string)            { return this.http.get<Sale>(`${this.base}/${id}`); }
  create(b: CreateSaleRequest)   { return this.http.post<Sale>(this.base, b); }
  voidSale(id: string, reason: string) {
    return this.http.patch<Sale>(`${this.base}/${id}/void`, { reason });
  }
  registerDelivery(saleId: string, b: DeliveryRequest) {
    return this.http.post<Delivery>(`${this.base}/${saleId}/deliver`, b);
  }
  getDelivery(saleId: string) {
    return this.http.get<Delivery>(`${this.base}/${saleId}/delivery`);
  }
}
