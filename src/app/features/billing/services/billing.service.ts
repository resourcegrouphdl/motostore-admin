import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BillingDocument, EmitRequest } from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/billing`;

  getAll()                     { return this.http.get<BillingDocument[]>(this.base); }
  getBySale(saleId: string)    { return this.http.get<BillingDocument[]>(`${this.base}/sale/${saleId}`); }
  getFailed()                  { return this.http.get<BillingDocument[]>(`${this.base}/failed`); }
  emit(b: EmitRequest)         { return this.http.post<BillingDocument>(`${this.base}/emit`, b); }
  voidDocument(id: string)     { return this.http.post<BillingDocument>(`${this.base}/${id}/void`, {}); }

  downloadPdf(id: string, filename: string) {
    return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' }).pipe(
      tap(blob => triggerDownload(blob, filename)),
      map(() => undefined as void)
    );
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
