export type AgingBucket       = '0-30' | '31-60' | '61-90' | '90+';
export type PaymentMethod     = 'CASH' | 'TRANSFER' | 'QR' | 'CARD';
export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface OverdueAccount {
  creditApplicationId: string;
  fullName:            string;
  dni:                 string;
  phone:               string | null;
  motoDescription:     string | null;
  totalOverdueSoles:   number;
  overdueInstallments: number;
  daysOverdue:         number;
  nextPaymentDate:     string | null;
  nextPaymentAmount:   number | null;
  assignedAdvisor:     string | null;
}

export interface ScheduleEntry {
  id:                string;
  installmentNumber: number;
  dueDate:           string;
  principal:         number;
  interest:          number;
  total:             number;
  balance:           number;
  status:            InstallmentStatus;
  paidDate:          string | null;
  paidAmount:        number | null;
}

export interface CollectionPayment {
  id:           string;
  amount:       number;
  paymentDate:  string;
  method:       PaymentMethod;
  reference:    string | null;
  notes:        string | null;
  registeredBy: string;
}

export interface RegisterPaymentRequest {
  amount:     number;
  method:     PaymentMethod;
  reference?: string;
  notes?:     string;
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH:     'Efectivo',
  TRANSFER: 'Transferencia',
  QR:       'QR / Yape / Plin',
  CARD:     'Tarjeta',
};

export const INSTALLMENT_STATUS_LABEL: Record<InstallmentStatus, string> = {
  PENDING: 'Pendiente',
  PAID:    'Pagada',
  OVERDUE: 'Vencida',
};

export interface PaymentReminderResponse {
  creditApplicationId: string;
  phone:               string | null;
  wamid:               string | null;
  sent:                boolean;
  message:             string;
}

export const AGING_FILTERS: Array<{ value: AgingBucket | ''; label: string }> = [
  { value: '',      label: 'Todas' },
  { value: '0-30',  label: '1 – 30 días' },
  { value: '31-60', label: '31 – 60 días' },
  { value: '61-90', label: '61 – 90 días' },
  { value: '90+',   label: '+90 días' },
];

export function agingBucket(days: number): AgingBucket {
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}
