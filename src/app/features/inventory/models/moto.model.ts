export type MotoStatus =
  | 'IN_WAREHOUSE'
  | 'ON_DISPLAY'
  | 'RESERVED'
  | 'IN_CREDIT_EVALUATION'
  | 'IN_TRANSIT'
  | 'SOLD'
  | 'DEMO'
  | 'TRADE_IN';

export type AcquisitionMode =
  | 'DIRECT_PURCHASE'
  | 'CONSIGNMENT'
  | 'FLOOR_PLAN'
  | 'DEMO'
  | 'TRADE_IN'
  | 'TRANSFER'
  | 'RETURN';

export interface Moto {
  id:              string;
  vin:             string;
  brand:           string;
  model:           string;
  year:            number;
  color:           string | null;
  listPrice:       number | null;
  minimumPrice:    number | null;
  status:          MotoStatus;
  acquisitionMode: AcquisitionMode;
  notes:           string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface MotoCreateRequest {
  vin:             string;
  brand:           string;
  model:           string;
  year:            number;
  color?:          string;
  listPrice?:      number;
  minimumPrice?:   number;
  acquisitionMode: AcquisitionMode;
  notes?:          string;
}

export interface MotoStatusRequest  { status: string; }
export interface MotoReserveRequest { reservedBy: string; holdHours: number; }
export interface MotoReleaseRequest { targetStatus?: string; }
export interface MotoTransferRequest {
  fromWarehouseId?: string;
  toWarehouseId:    string;
  notes?:           string;
}

// Transiciones de estado permitidas (para UI — el backend las valida igualmente)
export const ALLOWED_TRANSITIONS: Partial<Record<MotoStatus, MotoStatus[]>> = {
  IN_WAREHOUSE:         ['ON_DISPLAY', 'DEMO', 'IN_TRANSIT'],
  ON_DISPLAY:           ['IN_WAREHOUSE', 'RESERVED', 'DEMO'],
  RESERVED:             ['ON_DISPLAY', 'IN_WAREHOUSE', 'IN_CREDIT_EVALUATION'],
  IN_CREDIT_EVALUATION: ['RESERVED', 'ON_DISPLAY', 'IN_WAREHOUSE'],
  DEMO:                 ['IN_WAREHOUSE', 'ON_DISPLAY'],
  IN_TRANSIT:           [],
  SOLD:                 [],
  TRADE_IN:             ['IN_WAREHOUSE'],
};

// ── Labels y colores de estado ──────────────────────────────────

export const STATUS_LABEL: Record<MotoStatus, string> = {
  IN_WAREHOUSE:           'En almacén',
  ON_DISPLAY:             'En exhibición',
  RESERVED:               'Reservada',
  IN_CREDIT_EVALUATION:   'En crédito',
  IN_TRANSIT:             'En tránsito',
  SOLD:                   'Vendida',
  DEMO:                   'Demo',
  TRADE_IN:               'Trade-in',
};

export const STATUS_COLOR: Record<MotoStatus, 'success' | 'accent' | 'warning' | 'info' | 'muted'> = {
  IN_WAREHOUSE:           'success',
  ON_DISPLAY:             'accent',
  RESERVED:               'warning',
  IN_CREDIT_EVALUATION:   'info',
  IN_TRANSIT:             'info',
  SOLD:                   'muted',
  DEMO:                   'info',
  TRADE_IN:               'muted',
};

export const FILTER_OPTIONS: { status: MotoStatus | null; label: string }[] = [
  { status: null,                   label: 'Todos' },
  { status: 'IN_WAREHOUSE',         label: 'En almacén' },
  { status: 'ON_DISPLAY',           label: 'Exhibición' },
  { status: 'RESERVED',             label: 'Reservada' },
  { status: 'IN_CREDIT_EVALUATION', label: 'En crédito' },
  { status: 'SOLD',                 label: 'Vendida' },
];
