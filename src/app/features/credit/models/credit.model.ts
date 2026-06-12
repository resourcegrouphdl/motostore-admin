export type CreditStatus =
  | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'CONDITIONAL'
  | 'REJECTED'  | 'DISBURSED' | 'CANCELLED';

export type EmploymentType =
  | 'EMPLOYEE' | 'SELF_EMPLOYED' | 'INFORMAL' | 'PENSIONER' | 'OTHER';

export interface CreditApplication {
  id:                  string;
  fullName:            string;
  dni:                 string;
  phone:               string | null;
  email:               string | null;
  employmentType:      EmploymentType;
  monthlyIncome:       number;
  motoId:              string | null;
  motoDescription:     string | null;
  requestedAmount:     number;
  initialAmount:       number | null;
  requestedTermMonths: number;
  status:              CreditStatus;
  score:               number;
  qualification:       string;
  rejectionReason:     string | null;
  approvedAmount:      number | null;
  approvedTermMonths:  number | null;
  approvedRateTea:     number | null;
  fintech:             string | null;
  submittedAt:         string | null;
  approvedAt:          string | null;
  rejectedAt:          string | null;
  createdAt:           string;
}

export interface ApproveRequest {
  amount:     number;
  termMonths: number;
  rateTea:    number;
  fintech:    string;
}

export const STATUS_LABEL: Record<CreditStatus, string> = {
  SUBMITTED:   'Nueva',
  IN_REVIEW:   'En revisión',
  APPROVED:    'Aprobada',
  CONDITIONAL: 'Condicional',
  REJECTED:    'Rechazada',
  DISBURSED:   'Desembolsada',
  CANCELLED:   'Cancelada',
};

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  EMPLOYEE:      'Dependiente',
  SELF_EMPLOYED: 'Independiente',
  INFORMAL:      'Informal',
  PENSIONER:     'Pensionista',
  OTHER:         'Otro',
};

export const QUAL_LABEL: { [key: string]: string } = {
  APPROVED:    'Aprobado',
  CONDITIONAL: 'Condicional',
  IN_REVIEW:   'En revisión',
  REJECTED:    'Rechazado',
};

export const FILTER_STATUSES: Array<{ value: CreditStatus | ''; label: string }> = [
  { value: '',            label: 'Todas' },
  { value: 'SUBMITTED',  label: 'Nuevas' },
  { value: 'IN_REVIEW',  label: 'En revisión' },
  { value: 'APPROVED',   label: 'Aprobadas' },
  { value: 'CONDITIONAL',label: 'Condicionales' },
  { value: 'REJECTED',   label: 'Rechazadas' },
  { value: 'DISBURSED',  label: 'Desembolsadas' },
];

export const TERM_OPTIONS = [12, 18, 24, 36];
