export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type PensionType   = 'AFP' | 'ONP';
export type AfpName       = 'INTEGRA' | 'HABITAT' | 'PRIMA' | 'PROFUTURO';
export type PayrollStatus = 'DRAFT' | 'PROCESSED' | 'PAID';

export interface Employee {
  id:           string;
  firstName:    string;
  lastName:     string;
  fullName:     string;
  dni:          string;
  position:     string;
  department:   string;
  baseSalary:   number;
  pensionType:  PensionType;
  afpName:      AfpName | null;
  startDate:    string;
  status:       EmployeeStatus;
  bankAccount:  string | null;
  bankName:     string | null;
}

export interface PayrollPeriod {
  id:                  string;
  year:                number;
  month:               number;
  status:              PayrollStatus;
  totalRemuneraciones: number;
  totalDescuentos:     number;
  totalNeto:           number;
  totalEssalud:        number;
  processedAt:         string | null;
}

export interface PayrollItem {
  id:                   string;
  periodId:             string;
  employeeId:           string;
  employeeName:         string;
  dni:                  string;
  position:             string;
  pensionType:          PensionType;
  afpName:              AfpName | null;
  baseSalary:           number;
  assignacionFamiliar:  number;
  grossSalary:          number;
  pensionContribution:  number;
  incomeTaxRetention:   number;
  otherDeductions:      number;
  totalDeductions:      number;
  netSalary:            number;
  employerEssalud:      number;
  workedDays:           number;
}

export interface CreateEmployeeRequest {
  firstName:   string;
  lastName:    string;
  dni:         string;
  position:    string;
  department:  string;
  baseSalary:  number;
  pensionType: PensionType;
  afpName:     AfpName | null;
  startDate:   string;
  bankAccount: string;
  bankName:    string;
}

export interface ProcessPayrollRequest {
  year:  number;
  month: number;
}

export interface EmployeeFormState {
  firstName:   string;
  lastName:    string;
  dni:         string;
  position:    string;
  department:  string;
  baseSalary:  number | undefined;
  pensionType: PensionType;
  afpName:     AfpName | '';
  startDate:   string;
  bankAccount: string;
  bankName:    string;
}

// ── Constants ──────────────────────────────────────────────
export const PENSION_TYPE_LABEL: Record<PensionType, string> = {
  AFP: 'AFP (privada)',
  ONP: 'ONP (pública)',
};

export const AFP_NAMES: Array<{ value: AfpName; label: string; rate: number }> = [
  { value: 'INTEGRA',   label: 'AFP Integra',   rate: 10.23 },
  { value: 'HABITAT',   label: 'AFP Habitat',   rate: 10.00 },
  { value: 'PRIMA',     label: 'Prima AFP',     rate: 10.23 },
  { value: 'PROFUTURO', label: 'AFP Profuturo', rate: 10.23 },
];

export const PAYROLL_STATUS_LABEL: Record<PayrollStatus, string> = {
  DRAFT:     'Borrador',
  PROCESSED: 'Procesada',
  PAID:      'Pagada',
};

export const BANK_NAMES = ['BCP', 'Interbank', 'BBVA', 'Scotiabank', 'BanBif', 'Pichincha', 'Otro'];

export const DEPARTMENTS = [
  'Ventas', 'Crédito y Cobranzas', 'Taller', 'Almacén', 'Administración',
  'Contabilidad', 'Sistemas', 'Gerencia',
];

export const MONTH_LABEL: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

export const SUELDO_MINIMO = 1025;

export function emptyEmployeeForm(): EmployeeFormState {
  return {
    firstName: '', lastName: '', dni: '', position: '',
    department: DEPARTMENTS[0], baseSalary: undefined,
    pensionType: 'AFP', afpName: 'INTEGRA',
    startDate: '', bankAccount: '', bankName: 'BCP',
  };
}
