export type PeriodStatus = 'OPEN' | 'CLOSED';
export type AccountType  = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type EntrySource  = 'SALE' | 'PAYMENT' | 'PAYROLL' | 'MANUAL' | 'OPENING' | 'ADJUSTMENT';
export type SunatDocType = '01' | '03' | '07' | '08';

export interface AccountingPeriod {
  id:           string;
  year:         number;
  month:        number;
  status:       PeriodStatus;
  totalEntries: number;
  closedAt:     string | null;
}

export interface Account {
  code:          string;
  name:          string;
  type:          AccountType;
  parentCode:    string | null;
  level:         number;
  debitBalance:  number;
  creditBalance: number;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  description: string;
  debit:       number;
  credit:      number;
}

export interface JournalEntry {
  id:          string;
  date:        string;
  reference:   string;
  description: string;
  source:      EntrySource;
  lines:       JournalLine[];
  totalDebit:  number;
  totalCredit: number;
}

export interface TrialBalanceRow {
  accountCode:   string;
  accountName:   string;
  level:         number;
  debitBalance:  number;
  creditBalance: number;
}

export interface IncomeStatementRow {
  label:       string;
  amount:      number;
  isTotal:     boolean;
  isSeparator: boolean;
  indent:      number;
}

export interface SunatSalesRecord {
  correlativo:    number;
  fechaEmision:   string;
  tipoDoc:        SunatDocType;
  serie:          string;
  numero:         string;
  rucCliente:     string;
  razonSocial:    string;
  baseImponible:  number;
  igv:            number;
  total:          number;
}

export interface SunatPurchaseRecord {
  correlativo:    number;
  fechaEmision:   string;
  tipoDoc:        SunatDocType;
  serie:          string;
  numero:         string;
  rucProveedor:   string;
  razonSocial:    string;
  baseImponible:  number;
  igv:            number;
  total:          number;
}

export const PERIOD_STATUS_LABEL: Record<PeriodStatus, string> = {
  OPEN:   'Abierto',
  CLOSED: 'Cerrado',
};

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  ASSET:     'Activo',
  LIABILITY: 'Pasivo',
  EQUITY:    'Patrimonio',
  REVENUE:   'Ingresos',
  EXPENSE:   'Gastos',
};

export const ENTRY_SOURCE_LABEL: Record<EntrySource, string> = {
  SALE:       'Venta',
  PAYMENT:    'Pago',
  PAYROLL:    'Planilla',
  MANUAL:     'Manual',
  OPENING:    'Apertura',
  ADJUSTMENT: 'Ajuste',
};

export const ACCOUNT_TYPES: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export const MONTH_LABEL: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};
