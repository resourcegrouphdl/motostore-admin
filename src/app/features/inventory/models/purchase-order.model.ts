export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id:               string;
  repuestoId:       string;
  quantityOrdered:  number;
  quantityReceived: number;
  quantityPending:  number;
  unitCost:         number | null;
}

export interface PurchaseOrder {
  id:           string;
  orderNumber:  string;
  supplierName: string;
  supplierRuc:  string | null;
  status:       PurchaseOrderStatus;
  notes:        string | null;
  expectedAt:   string | null;
  receivedAt:   string | null;
  totalAmount:  number | null;
  items:        PurchaseOrderItem[];
  audit:        { createdAt: string; updatedAt: string; createdBy: string; updatedBy: string };
}

export interface PurchaseOrderCreateRequest {
  supplierName: string;
  supplierRuc?: string;
  notes?:       string;
  expectedAt?:  string;
  items: {
    repuestoId:      string;
    quantityOrdered: number;
    unitCost?:       number;
  }[];
}

export interface ReceiveStockRequest {
  warehouseId: string;
  receipts: {
    itemId:           string;
    repuestoId:       string;
    quantityReceived: number;
  }[];
}

export const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  DRAFT:     'Borrador',
  SENT:      'Enviada',
  PARTIAL:   'Recepción parcial',
  RECEIVED:  'Recibida',
  CANCELLED: 'Cancelada',
};

export const STATUS_COLOR: Record<PurchaseOrderStatus, string> = {
  DRAFT:     'muted',
  SENT:      'info',
  PARTIAL:   'warning',
  RECEIVED:  'success',
  CANCELLED: 'muted',
};

export const STATUS_FILTERS: { status: PurchaseOrderStatus | null; label: string }[] = [
  { status: null,        label: 'Todas' },
  { status: 'DRAFT',     label: 'Borrador' },
  { status: 'SENT',      label: 'Enviadas' },
  { status: 'PARTIAL',   label: 'Parciales' },
  { status: 'RECEIVED',  label: 'Recibidas' },
  { status: 'CANCELLED', label: 'Canceladas' },
];
