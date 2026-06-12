export type WarehouseType = 'MAIN' | 'SECONDARY' | 'SHOWROOM' | 'TRANSIT' | 'VIRTUAL';

export interface Warehouse {
  id:          string;
  code:        string;
  name:        string;
  type:        WarehouseType;
  address:     string | null;
  publicFacing: boolean;
  active:      boolean;
  audit: { createdAt: string; updatedAt: string; createdBy: string; updatedBy: string };
}

export interface WarehouseCreateRequest {
  code:        string;
  name:        string;
  type:        WarehouseType;
  address?:    string;
  publicFacing: boolean;
}

export interface WarehouseUpdateRequest {
  name?:        string;
  type?:        WarehouseType;
  address?:     string;
  publicFacing?: boolean;
  active?:       boolean;
}

export const WAREHOUSE_TYPE_LABEL: Record<WarehouseType, string> = {
  MAIN:      'Principal',
  SECONDARY: 'Secundario',
  SHOWROOM:  'Sala de exhibición',
  TRANSIT:   'Tránsito',
  VIRTUAL:   'Virtual',
};

export const WAREHOUSE_TYPE_COLOR: Record<WarehouseType, string> = {
  MAIN:      'accent',
  SECONDARY: 'info',
  SHOWROOM:  'success',
  TRANSIT:   'warning',
  VIRTUAL:   'muted',
};

export const ALL_WAREHOUSE_TYPES: WarehouseType[] =
  ['MAIN', 'SECONDARY', 'SHOWROOM', 'TRANSIT', 'VIRTUAL'];
