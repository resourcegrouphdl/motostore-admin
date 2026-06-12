import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  CollectionPayment, OverdueAccount, PaymentReminderResponse,
  RegisterPaymentRequest, ScheduleEntry,
} from '../models/collection.model';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/collection`;

  getOverdueAccounts()             { return this.http.get<OverdueAccount[]>(`${this.base}/overdue`); }
  getSchedule(creditId: string)    { return this.http.get<ScheduleEntry[]>(`${this.base}/${creditId}/schedule`); }
  getPayments(creditId: string)    { return this.http.get<CollectionPayment[]>(`${this.base}/${creditId}/payments`); }

  registerPayment(creditId: string, req: RegisterPaymentRequest) {
    return this.http.post<CollectionPayment>(`${this.base}/${creditId}/payments`, req);
  }

  sendReminder(creditId: string) {
    return this.http.post<PaymentReminderResponse>(`${this.base}/${creditId}/remind`, {});
  }
}
