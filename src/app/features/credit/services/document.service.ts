import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreditDocument, DocumentType } from '../models/document.model';

interface UploadUrlRequest {
  creditApplicationId: string;
  documentType:        DocumentType;
  fileName?:           string;
  contentType?:        string;
}

interface UploadUrlResponse {
  documentId:       string;
  uploadUrl:        string;
  expiresInSeconds: number;
}

interface DownloadUrlResponse {
  documentId:       string;
  downloadUrl:      string;
  expiresInSeconds: number;
}

interface ReviewRequest {
  approved: boolean;
  notes?:   string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private base = '/api/v1/documents';

  getByCredit(creditApplicationId: string): Observable<CreditDocument[]> {
    return this.http.get<CreditDocument[]>(`${this.base}/credit/${creditApplicationId}`);
  }

  getDownloadUrl(id: string): Observable<DownloadUrlResponse> {
    return this.http.get<DownloadUrlResponse>(`${this.base}/${id}/download-url`);
  }

  requestUploadUrl(body: UploadUrlRequest): Observable<UploadUrlResponse> {
    return this.http.post<UploadUrlResponse>(`${this.base}/upload-url`, body);
  }

  review(id: string, approved: boolean, notes?: string): Observable<CreditDocument> {
    const body: ReviewRequest = { approved };
    if (notes) body.notes = notes;
    return this.http.patch<CreditDocument>(`${this.base}/${id}/review`, body);
  }
}
