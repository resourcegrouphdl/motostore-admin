import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantInfo } from './tenant-session.service';

@Injectable({ providedIn: 'root' })
export class TenantsApiService {
  private http = inject(HttpClient);

  getMyTenants(): Observable<TenantInfo[]> {
    return this.http.get<TenantInfo[]>(`${environment.apiUrl}/api/v1/me/tenants`);
  }
}
