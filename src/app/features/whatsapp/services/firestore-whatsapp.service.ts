import { inject, Injectable } from '@angular/core';
import { collection, collectionData, Firestore, orderBy, query } from '@angular/fire/firestore';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WaConversation, WaMessage } from '../models/whatsapp.model';

@Injectable({ providedIn: 'root' })
export class FirestoreWhatsAppService {
  private fs = inject(Firestore);

  watchConversations(slug: string): Observable<WaConversation[]> {
    const q = query(
      collection(this.fs, `tenants/${slug}/conversations`),
      orderBy('updatedAt', 'desc'),
    );
    return (collectionData(q) as Observable<any[]>).pipe(
      map(docs => docs.map(d => this.mapConv(d))),
      catchError(err => {
        console.error('[Firestore] watchConversations error:', err);
        return EMPTY;
      }),
    );
  }

  watchMessages(slug: string, convId: string): Observable<WaMessage[]> {
    const q = query(
      collection(this.fs, `tenants/${slug}/conversations/${convId}/messages`),
      orderBy('sentAt', 'asc'),
    );
    return (collectionData(q) as Observable<any[]>).pipe(
      map(docs => docs.map(d => this.mapMsg(d))),
      catchError(err => {
        console.error('[Firestore] watchMessages error:', err);
        return EMPTY;
      }),
    );
  }

  private mapConv(d: any): WaConversation {
    return {
      id:            d['id'] ?? '',
      phone:         d['customerPhone'] ?? '',
      clientName:    d['customerName'] || null,
      lastMessage:   d['lastMessageContent'] ?? null,
      lastMessageAt: this.toIso(d['lastMessageAt']),
      unreadCount:   d['unreadCount'] ?? 0,
      status:        d['status'] ?? 'OPEN',
    };
  }

  private mapMsg(d: any): WaMessage {
    return {
      id:            d['id'] ?? '',
      conversationId: d['conversationId'] ?? '',
      direction:     d['direction'] ?? 'INBOUND',
      type:          d['type'] ?? 'TEXT',
      content:       d['content'] ?? '',
      templateName:  d['templateName'] ?? null,
      metaMessageId: d['metaMessageId'] ?? null,
      status:        d['status'] ?? 'SENT',
      createdAt:     this.toIso(d['sentAt']),
    };
  }

  private toIso(ts: any): string {
    if (!ts) return new Date().toISOString();
    if (typeof ts.toDate === 'function') return (ts.toDate() as Date).toISOString();
    if (ts instanceof Date) return ts.toISOString();
    return new Date(ts).toISOString();
  }
}
