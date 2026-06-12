export type DocumentType   = 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO' | 'GUIA_REMISION';
export type DocumentStatus = 'PENDING' | 'EMITTED' | 'FAILED' | 'VOIDED';

export interface BillingDocument {
  id:             string;
  saleId:         string | null;
  type:           DocumentType;
  serie:          string;
  correlativo:    number;
  documentNumber: string;
  status:         DocumentStatus;
  customerRuc:    string | null;
  customerName:   string | null;
  subtotal:       number;
  igv:            number;
  total:          number;
  xmlUrl:         string | null;
  pdfUrl:         string | null;
  errorMessage:   string | null;
  retryCount:     number;
  emittedAt:      string | null;
  createdAt:      string;
}

export interface EmitRequest {
  saleId:       string;
  type:         DocumentType;
  customerRuc?: string;
  customerName?: string;
}

export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  BOLETA:       'Boleta',
  FACTURA:      'Factura',
  NOTA_CREDITO: 'Nota de crédito',
  GUIA_REMISION:'Guía de remisión',
};

export const DOC_STATUS_LABEL: Record<DocumentStatus, string> = {
  PENDING: 'Pendiente',
  EMITTED: 'Emitida',
  FAILED:  'Error',
  VOIDED:  'Anulada',
};

export const EMITTABLE_TYPES: DocumentType[] = ['BOLETA', 'FACTURA'];
