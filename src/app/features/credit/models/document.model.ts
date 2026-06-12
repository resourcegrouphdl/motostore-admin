export type DocumentType =
  | 'DNI_FRONT' | 'DNI_BACK' | 'SELFIE'
  | 'INCOME_PROOF' | 'EMPLOYMENT_CERTIFICATE' | 'BANK_STATEMENT';

export type DocumentStatus =
  | 'PENDING_UPLOAD' | 'UPLOADED' | 'OCR_PROCESSING' | 'APPROVED' | 'REJECTED';

export interface CreditDocument {
  id:                  string;
  creditApplicationId: string;
  documentType:        DocumentType;
  status:              DocumentStatus;
  fileName:            string | null;
  contentType:         string | null;
  ocrData:             string | null;
  reviewNotes:         string | null;
  reviewedBy:          string | null;
  reviewedAt:          string | null;
  createdAt:           string;
  updatedAt:           string;
}

export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  DNI_FRONT:              'DNI Anverso',
  DNI_BACK:               'DNI Reverso',
  SELFIE:                 'Selfie con DNI',
  INCOME_PROOF:           'Comprobante de ingresos',
  EMPLOYMENT_CERTIFICATE: 'Constancia de trabajo',
  BANK_STATEMENT:         'Estado de cuenta',
};

export const DOC_STATUS_LABEL: Record<DocumentStatus, string> = {
  PENDING_UPLOAD: 'Pendiente',
  UPLOADED:       'Cargado',
  OCR_PROCESSING: 'Procesando OCR',
  APPROVED:       'Aprobado',
  REJECTED:       'Rechazado',
};
