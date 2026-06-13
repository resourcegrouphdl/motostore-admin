import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import {
  WorkOrder, WorkOrderItem, WorkOrderPhoto, AddPhotoRequest,
  CreateWorkOrderPayload, AddItemPayload,
} from '../models/workshop.model';

const BASE = '/api/v1/workshop';

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private http = inject(HttpClient);

  getAll(): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(`${BASE}/orders`);
  }

  getById(id: string): Observable<WorkOrder> {
    return this.http.get<WorkOrder>(`${BASE}/orders/${id}`);
  }

  create(payload: CreateWorkOrderPayload): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${BASE}/orders`, payload);
  }

  updateStatus(id: string, status: string): Observable<WorkOrder> {
    return this.http.patch<WorkOrder>(`${BASE}/orders/${id}/status`, { status });
  }

  updateDiagnosis(id: string, diagnostico: string): Observable<WorkOrder> {
    return this.http.patch<WorkOrder>(`${BASE}/orders/${id}/diagnosis`, { diagnostico });
  }

  updateApproval(id: string, estadoAprobacion: string): Observable<WorkOrder> {
    return this.http.patch<WorkOrder>(`${BASE}/orders/${id}/approval`, { estadoAprobacion });
  }

  addItem(orderId: string, payload: AddItemPayload): Observable<WorkOrderItem> {
    return this.http.post<WorkOrderItem>(`${BASE}/orders/${orderId}/items`, payload);
  }

  removeItem(orderId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/orders/${orderId}/items/${itemId}`);
  }

  closeOrder(id: string, payload: {
    kilometrajeSalida?:  number;
    proximaRevisionKm?:  number;
    tiempoRealHoras?:    number;
    firmaEntrega?:       string;
    mecanicoUid?:        string;
  }): Observable<WorkOrder> {
    return this.http.patch<WorkOrder>(`${BASE}/orders/${id}/close`, payload);
  }

  getPhotos(orderId: string): Observable<WorkOrderPhoto[]> {
    return this.http.get<WorkOrderPhoto[]>(`${BASE}/orders/${orderId}/photos`);
  }

  addPhoto(orderId: string, req: AddPhotoRequest): Observable<WorkOrderPhoto> {
    return this.http.post<WorkOrderPhoto>(`${BASE}/orders/${orderId}/photos`, req);
  }

  deletePhoto(orderId: string, photoId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/orders/${orderId}/photos/${photoId}`);
  }

  downloadPdf(id: string, filename: string): Observable<void> {
    return this.http.get(`${BASE}/orders/${id}/pdf`, { responseType: 'blob' }).pipe(
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
