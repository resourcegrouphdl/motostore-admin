import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BroadcastRequest, BroadcastResult, BroadcastSegment,
  SendReplyRequest, SendTemplateRequest,
  WaConversation, WaMessage,
} from '../models/whatsapp.model';

export interface SegmentCountResponse {
  segment: BroadcastSegment;
  count:   number;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/notifications/whatsapp`;

  getConversations(): Observable<WaConversation[]> {
    return this.http.get<WaConversation[]>(`${this.base}/conversations`);
  }

  getMessages(convId: string): Observable<WaMessage[]> {
    return this.http.get<WaMessage[]>(`${this.base}/conversations/${convId}/messages`);
  }

  reply(convId: string, req: SendReplyRequest): Observable<WaMessage> {
    return this.http.post<WaMessage>(`${this.base}/conversations/${convId}/reply`, req);
  }

  markRead(convId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/conversations/${convId}/read`, {});
  }

  sendTemplate(req: SendTemplateRequest): Observable<WaMessage> {
    return this.http.post<WaMessage>(`${this.base}/template`, req);
  }

  getSegmentCount(segment: BroadcastSegment): Observable<SegmentCountResponse> {
    const params = new HttpParams().set('segment', segment);
    return this.http.get<SegmentCountResponse>(`${this.base}/broadcast/count`, { params });
  }

  broadcast(req: BroadcastRequest): Observable<BroadcastResult> {
    return this.http.post<BroadcastResult>(`${this.base}/broadcast`, req);
  }
}
