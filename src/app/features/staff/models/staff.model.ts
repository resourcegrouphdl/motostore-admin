export type StaffRole = 'MANAGER' | 'SELLER' | 'ADVISOR' | 'CASHIER' | 'WAREHOUSE' | 'MECHANIC';

export interface StaffAudit {
  createdAt:  string;
  updatedAt:  string;
  createdBy:  string | null;
  updatedBy:  string | null;
}

export interface StaffMember {
  id:          string;
  firebaseUid: string;
  email:       string;
  fullName:    string;
  role:        StaffRole;
  isActive:    boolean;
  lastLoginAt: string | null;
  audit:       StaffAudit;
}

export interface StaffCreateRequest {
  email:    string;
  fullName: string;
  role:     StaffRole;
}

export interface StaffUpdateRequest {
  fullName?: string;
  role?:     StaffRole;
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  MANAGER:   'Gerente',
  SELLER:    'Vendedor',
  ADVISOR:   'Asesor',
  CASHIER:   'Cajero',
  WAREHOUSE: 'Almacenero',
  MECHANIC:  'Mecánico',
};

export const ROLE_COLORS: Record<StaffRole, string> = {
  MANAGER:   'primary',
  SELLER:    'accent',
  ADVISOR:   'accent',
  CASHIER:   '',
  WAREHOUSE: '',
  MECHANIC:  '',
};

export const ALL_ROLES: StaffRole[] = ['MANAGER', 'SELLER', 'ADVISOR', 'CASHIER', 'WAREHOUSE', 'MECHANIC'];
