import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BillingSetting, BillingSettingRequest, FintechConfig, WhatsappConfig, WhatsappConfigRequest } from './settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/settings`;

  getBilling()                              { return this.http.get<BillingSetting>(`${this.base}/billing`); }
  updateBilling(req: BillingSettingRequest) { return this.http.patch<BillingSetting>(`${this.base}/billing`, req); }

  getFintechs()                 { return this.http.get<FintechConfig[]>(`${this.base}/fintechs`); }
  toggleFintech(code: string)   { return this.http.patch<FintechConfig>(`${this.base}/fintechs/${code}/toggle`, {}); }

  getWhatsapp()                               { return this.http.get<WhatsappConfig>(`${this.base}/whatsapp`); }
  updateWhatsapp(req: WhatsappConfigRequest)  { return this.http.patch<WhatsappConfig>(`${this.base}/whatsapp`, req); }
}
