import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  Account, AccountingPeriod, IncomeStatementRow, JournalEntry,
  SunatPurchaseRecord, SunatSalesRecord, TrialBalanceRow,
} from '../models/accounting.model';

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/accounting`;

  getPeriods() {
    return this.http.get<AccountingPeriod[]>(`${this.base}/periods`);
  }

  getJournalEntries(periodId: string, q = '') {
    const params = new HttpParams().set('periodId', periodId).set('q', q);
    return this.http.get<JournalEntry[]>(`${this.base}/journal`, { params });
  }

  getChartOfAccounts() {
    return this.http.get<Account[]>(`${this.base}/chart-of-accounts`);
  }

  getTrialBalance(periodId: string) {
    const params = new HttpParams().set('periodId', periodId);
    return this.http.get<TrialBalanceRow[]>(`${this.base}/trial-balance`, { params });
  }

  getIncomeStatement(periodId: string) {
    const params = new HttpParams().set('periodId', periodId);
    return this.http.get<IncomeStatementRow[]>(`${this.base}/income-statement`, { params });
  }

  getSunatSales(periodId: string) {
    const params = new HttpParams().set('periodId', periodId);
    return this.http.get<SunatSalesRecord[]>(`${this.base}/sunat/sales`, { params });
  }

  getSunatPurchases(periodId: string) {
    const params = new HttpParams().set('periodId', periodId);
    return this.http.get<SunatPurchaseRecord[]>(`${this.base}/sunat/purchases`, { params });
  }

  closePeriod(periodId: string) {
    return this.http.post<AccountingPeriod>(`${this.base}/periods/${periodId}/close`, {});
  }
}
