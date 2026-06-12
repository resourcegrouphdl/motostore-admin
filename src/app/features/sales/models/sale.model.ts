export type SaleStatus    = 'PENDING' | 'COMPLETED' | 'VOIDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CREDIT' | 'CONSIGNMENT';

export interface SaleItem {
  id:         string;
  repuestoId: string;
  quantity:   number;
  unitPrice:  number;
  subtotal:   number;
}

export interface Sale {
  id:            string;
  customerId:    string;
  motoId:        string | null;
  opportunityId: string | null;
  sellerUid:     string;
  totalAmount:   number;
  paymentMethod: PaymentMethod;
  status:        SaleStatus;
  notes:         string | null;
  voidedAt:      string | null;
  voidReason:    string | null;
  items:         SaleItem[];
  createdAt:     string;
  updatedAt:     string;
}

export interface CreateSaleRequest {
  customerId:    string;
  motoId?:       string;
  opportunityId?: string;
  totalAmount:   number;
  paymentMethod: PaymentMethod;
  notes?:        string;
  items?:        { repuestoId: string; quantity: number; unitPrice: number }[];
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH:          'Efectivo',
  BANK_TRANSFER: 'Transferencia bancaria',
  CARD:          'Tarjeta',
  CREDIT:        'Crédito',
  CONSIGNMENT:   'Consignación',
};

export const ALL_PAYMENT_METHODS: PaymentMethod[] =
  ['CASH', 'BANK_TRANSFER', 'CARD', 'CREDIT', 'CONSIGNMENT'];

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  PENDING:   'Pendiente',
  COMPLETED: 'Completada',
  VOIDED:    'Anulada',
};

// ── Delivery ─────────────────────────────────────────────────────────────

export interface Delivery {
  id:             string;
  saleId:         string;
  deliveredAt:    string;
  receivedByName: string;
  receivedByDni:  string;
  odometerKm:     number | null;
  notes:          string | null;
  signatureUrl:   string;
  photos:         string[];
  registeredBy:   string;
  createdAt:      string;
}

export interface DeliveryRequest {
  receivedByName: string;
  receivedByDni:  string;
  odometerKm?:    number;
  notes?:         string;
  signatureUrl:   string;
  photos:         string[];
}

export interface PhotoSlot {
  label:    string;
  key:      string;
  required: boolean;
  dataUrl:  string | null;
  uploading: boolean;
  error:    string | null;
}

export const DELIVERY_PHOTO_SLOTS: Omit<PhotoSlot, 'dataUrl' | 'uploading' | 'error'>[] = [
  { label: 'Frente',       key: 'front',   required: true  },
  { label: 'Lateral der.', key: 'right',   required: true  },
  { label: 'Odómetro',     key: 'odo',     required: false },
  { label: 'Otra',         key: 'extra',   required: false },
];
