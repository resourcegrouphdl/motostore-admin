import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CreditApplication } from '../models/credit.model';

@Injectable({ providedIn: 'root' })
export class CreditAdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/credit`;

  getAll()              { return this.http.get<CreditApplication[]>(this.base); }
  getById(id: string)   { return this.http.get<CreditApplication>(`${this.base}/${id}`); }

  markInReview(id: string) {
    return this.http.patch<CreditApplication>(`${this.base}/${id}/review`, {});
  }

  approve(id: string, amount: number, termMonths: number, rateTea: number, fintech: string) {
    const params = new HttpParams()
      .set('amount',     amount.toString())
      .set('termMonths', termMonths.toString())
      .set('rateTea',    rateTea.toString())
      .set('fintech',    fintech);
    return this.http.patch<CreditApplication>(`${this.base}/${id}/approve`, {}, { params });
  }

  reject(id: string, reason: string) {
    const params = new HttpParams().set('reason', reason);
    return this.http.patch<CreditApplication>(`${this.base}/${id}/reject`, {}, { params });
  }

  disburse(id: string) {
    return this.http.patch<CreditApplication>(`${this.base}/${id}/disburse`, {});
  }
}
