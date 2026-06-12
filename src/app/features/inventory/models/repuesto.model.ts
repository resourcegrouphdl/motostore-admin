// ── Domain types ─────────────────────────────────────────────────────────────

export type RepuestoCategory =
  | 'ENGINE' | 'ELECTRICAL' | 'BRAKE' | 'SUSPENSION' | 'BODY'
  | 'TRANSMISSION' | 'COOLING' | 'FUEL' | 'LIGHTING' | 'ACCESSORY' | 'OTHER';

export type UnitOfMeasure = 'UNIT' | 'KG' | 'LITER' | 'METER' | 'SET';

export interface StockLevelResponse {
  repuestoId: string;
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
}

export interface Repuesto {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: RepuestoCategory;
  brand?: string;
  unitOfMeasure: UnitOfMeasure;
  listPrice?: number;
  costPrice?: number;
  minimumStock: number;
  active: boolean;
  audit: { createdAt: string; updatedAt: string; createdBy: string; updatedBy: string };
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

export interface RepuestoCreateRequest {
  sku: string;
  name: string;
  description?: string;
  category: RepuestoCategory;
  brand?: string;
  unitOfMeasure: UnitOfMeasure;
  listPrice?: number;
  costPrice?: number;
  minimumStock: number;
  initialWarehouseId?: string;
  initialStock?: number;
}

export interface RepuestoUpdateRequest {
  name?:         string;
  description?:  string;
  category?:     RepuestoCategory;
  brand?:        string;
  unitOfMeasure?: UnitOfMeasure;
  listPrice?:    number | null;
  costPrice?:    number | null;
  minimumStock?: number;
  active?:       boolean;
}

// ── Display constants ─────────────────────────────────────────────────────────

export const CATEGORY_LABEL: Record<RepuestoCategory, string> = {
  ENGINE:       'Motor',
  ELECTRICAL:   'Eléctrico',
  BRAKE:        'Frenos',
  SUSPENSION:   'Suspensión',
  BODY:         'Carrocería',
  TRANSMISSION: 'Transmisión',
  COOLING:      'Refrigeración',
  FUEL:         'Combustible',
  LIGHTING:     'Iluminación',
  ACCESSORY:    'Accesorios',
  OTHER:        'Otros',
};

// Maps to design-token color names used in data-color attributes
export const CATEGORY_COLOR: Record<RepuestoCategory, string> = {
  ENGINE:       'danger',
  ELECTRICAL:   'warning',
  BRAKE:        'danger',
  SUSPENSION:   'info',
  BODY:         'muted',
  TRANSMISSION: 'info',
  COOLING:      'accent',
  FUEL:         'warning',
  LIGHTING:     'accent',
  ACCESSORY:    'muted',
  OTHER:        'muted',
};

export const UOM_LABEL: Record<UnitOfMeasure, string> = {
  UNIT:  'unid.',
  KG:    'kg',
  LITER: 'lts',
  METER: 'mts',
  SET:   'kit',
};

// ── Filter options ────────────────────────────────────────────────────────────

export interface CategoryFilterOption {
  category: RepuestoCategory | null;
  label: string;
}

export const CATEGORY_FILTER_OPTIONS: CategoryFilterOption[] = [
  { category: null,           label: 'Todos' },
  { category: 'ENGINE',       label: 'Motor' },
  { category: 'ELECTRICAL',   label: 'Eléctrico' },
  { category: 'BRAKE',        label: 'Frenos' },
  { category: 'SUSPENSION',   label: 'Suspensión' },
  { category: 'BODY',         label: 'Carrocería' },
  { category: 'TRANSMISSION', label: 'Transmisión' },
  { category: 'ACCESSORY',    label: 'Accesorios' },
  { category: 'OTHER',        label: 'Otros' },
];

export const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as RepuestoCategory[];
export const ALL_UOM        = Object.keys(UOM_LABEL)      as UnitOfMeasure[];
