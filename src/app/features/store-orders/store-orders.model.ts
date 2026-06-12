export type StoreOrderStatus =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'EN_PREPARACION'
  | 'LISTO_RECOJO'
  | 'ENTREGADA'
  | 'CANCELADA';

export interface StoreOrderItem {
  id: string;
  repuestoId: string | null;
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface StoreOrder {
  id: string;
  numeroOrden: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  subtotal: number;
  igv: number;
  total: number;
  status: StoreOrderStatus;
  notes: string;
  createdAt: string;
  items: StoreOrderItem[];
  notificationSent?: boolean | null;
}

export const STATUS_LABEL: Record<StoreOrderStatus, string> = {
  PENDIENTE:      'Pendiente',
  CONFIRMADA:     'Confirmada',
  EN_PREPARACION: 'En Preparación',
  LISTO_RECOJO:   'Listo p/Recoger',
  ENTREGADA:      'Entregada',
  CANCELADA:      'Cancelada',
};

export const STATUS_NEXT: Partial<Record<StoreOrderStatus, { status: StoreOrderStatus; label: string }>> = {
  PENDIENTE:      { status: 'CONFIRMADA',     label: 'Confirmar pedido' },
  CONFIRMADA:     { status: 'EN_PREPARACION', label: 'Iniciar preparación' },
  EN_PREPARACION: { status: 'LISTO_RECOJO',   label: 'Marcar listo para recoger' },
  LISTO_RECOJO:   { status: 'ENTREGADA',      label: 'Marcar como entregado' },
};
