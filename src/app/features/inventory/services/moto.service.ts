import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  Moto, MotoCreateRequest, MotoStatus,
  MotoReserveRequest, MotoReleaseRequest, MotoTransferRequest,
} from '../models/moto.model';

@Injectable({ providedIn: 'root' })
export class MotoService {
  private http    = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/inventory/motos`;

  getAll(status?: MotoStatus | null) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Moto[]>(this.baseUrl, { params });
  }

  getById(id: string) {
    return this.http.get<Moto>(`${this.baseUrl}/${id}`);
  }

  create(request: MotoCreateRequest) {
    return this.http.post<Moto>(this.baseUrl, request);
  }

  changeStatus(id: string, status: MotoStatus) {
    return this.http.patch<Moto>(`${this.baseUrl}/${id}/status`, { status });
  }

  reserve(id: string, request: MotoReserveRequest) {
    return this.http.post<Moto>(`${this.baseUrl}/${id}/reserve`, request);
  }

  releaseHold(id: string, request?: MotoReleaseRequest) {
    return this.http.post<Moto>(`${this.baseUrl}/${id}/release`, request ?? {});
  }

  startTransfer(id: string, request: MotoTransferRequest) {
    return this.http.post<Moto>(`${this.baseUrl}/${id}/transfer`, request);
  }

  confirmTransfer(id: string) {
    return this.http.post<Moto>(`${this.baseUrl}/${id}/transfer/confirm`, {});
  }
}
