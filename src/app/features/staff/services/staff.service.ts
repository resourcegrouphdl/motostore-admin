import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { StaffMember, StaffCreateRequest, StaffUpdateRequest } from '../models/staff.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private http    = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/staff`;

  getAll() {
    return this.http.get<StaffMember[]>(this.baseUrl);
  }

  getMe() {
    return this.http.get<StaffMember>(`${this.baseUrl}/me`);
  }

  getById(id: string) {
    return this.http.get<StaffMember>(`${this.baseUrl}/${id}`);
  }

  create(request: StaffCreateRequest) {
    return this.http.post<StaffMember>(this.baseUrl, request);
  }

  update(id: string, request: StaffUpdateRequest) {
    return this.http.patch<StaffMember>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: string) {
    return this.http.delete<StaffMember>(`${this.baseUrl}/${id}`);
  }
}
