export type CustomerStatus = 'PROSPECT' | 'ACTIVE' | 'SUSPENDED' | 'WITH_CREDIT';
export type LeadSource     = 'WEB' | 'WHATSAPP' | 'FACEBOOK' | 'FIELD' | 'REFERRAL';
export type PipelineStage  =
  'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'DEMO_DONE' |
  'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST';
export type InteractionType = 'CALL' | 'VISIT' | 'WHATSAPP' | 'EMAIL' | 'NOTE';

export interface Customer {
  id:            string;
  firstName:     string;
  lastName:      string;
  fullName:      string;
  dni:           string | null;
  phone:         string | null;
  email:         string | null;
  status:        CustomerStatus;
  assignedToUid: string | null;
  notes:         string | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface Opportunity {
  id:                string;
  customerId:        string;
  motoId:            string | null;
  sellerUid:         string;
  stage:             PipelineStage;
  expectedCloseDate: string | null;
  notes:             string | null;
  wonAt:             string | null;
  lostAt:            string | null;
  lostReason:        string | null;
  createdAt:         string;
  updatedAt:         string;
}

export interface Interaction {
  id:            string;
  opportunityId: string;
  type:          InteractionType;
  notes:         string | null;
  occurredAt:    string;
  createdBy:     string;
}

export interface CreateCustomerRequest {
  firstName:     string;
  lastName:      string;
  dni?:          string;
  phone?:        string;
  email?:        string;
  assignedToUid?: string;
  notes?:        string;
}

export interface CreateOpportunityRequest {
  customerId: string;
  motoId?:    string;
  notes?:     string;
}

export interface CreateInteractionRequest {
  type:   InteractionType;
  notes?: string;
}

// ── Display constants ────────────────────────────────────────────

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  PROSPECT:    'Prospecto',
  ACTIVE:      'Activo',
  SUSPENDED:   'Suspendido',
  WITH_CREDIT: 'Con crédito',
};

export const CUSTOMER_STATUS_COLOR: Record<CustomerStatus, string> = {
  PROSPECT:    'muted',
  ACTIVE:      'accent',
  SUSPENDED:   'danger',
  WITH_CREDIT: 'success',
};

export const PIPELINE_STAGE_LABEL: Record<PipelineStage, string> = {
  NEW:            'Nuevo',
  CONTACTED:      'Contactado',
  DEMO_SCHEDULED: 'Demo agendada',
  DEMO_DONE:      'Demo realizada',
  PROPOSAL_SENT:  'Propuesta enviada',
  NEGOTIATION:    'Negociación',
  WON:            'Ganado',
  LOST:           'Perdido',
};

export const INTERACTION_TYPE_LABEL: Record<InteractionType, string> = {
  CALL:     'Llamada',
  VISIT:    'Visita',
  WHATSAPP: 'WhatsApp',
  EMAIL:    'Email',
  NOTE:     'Nota',
};

// ── Lead types ───────────────────────────────────────────────────
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED' | 'CONVERTED';

export interface Lead {
  id:            string;
  customerId:    string | null;
  source:        LeadSource;
  modelInterest: string | null;
  budgetMin:     number | null;
  budgetMax:     number | null;
  score:         number;
  status:        LeadStatus;
  notes:         string | null;
  createdAt:     string;
  updatedAt:     string;
  createdBy:     string;
}

export interface CreateLeadRequest {
  customerId?:    string;
  source:         LeadSource;
  modelInterest?: string;
  budgetMin?:     number;
  budgetMax?:     number;
  notes?:         string;
}

export interface TeamRankingEntry {
  sellerUid:      string;
  sellerName:     string;
  totalCount:     number;
  wonCount:       number;
  lostCount:      number;
  activeCount:    number;
  winRate:        number;
  avgDaysToClose: number;
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW:           'Nuevo',
  CONTACTED:     'Contactado',
  QUALIFIED:     'Calificado',
  DISQUALIFIED:  'Descartado',
  CONVERTED:     'Convertido',
};

export const LEAD_STATUS_COLOR: Record<LeadStatus, string> = {
  NEW:          'muted',
  CONTACTED:    'accent',
  QUALIFIED:    'success',
  DISQUALIFIED: 'danger',
  CONVERTED:    'info',
};

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  WEB:      'Web',
  WHATSAPP: 'WhatsApp',
  FACEBOOK: 'Facebook',
  FIELD:    'Campo',
  REFERRAL: 'Referido',
};

export const ALL_LEAD_STATUSES: LeadStatus[] = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED',
];

export const ALL_LEAD_SOURCES: LeadSource[] = [
  'WEB', 'WHATSAPP', 'FACEBOOK', 'FIELD', 'REFERRAL',
];

export const PIPELINE_STAGES_ACTIVE: PipelineStage[] = [
  'NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'PROPOSAL_SENT', 'NEGOTIATION',
];

export const ALL_PIPELINE_STAGES: PipelineStage[] = [
  ...PIPELINE_STAGES_ACTIVE, 'WON', 'LOST',
];

export const ALL_INTERACTION_TYPES: InteractionType[] =
  ['CALL', 'VISIT', 'WHATSAPP', 'EMAIL', 'NOTE'];

// ── Seller Goals ─────────────────────────────────────────────────

export interface SellerGoal {
  id:             string;
  sellerUid:      string;
  period:         string;
  targetUnits:    number;
  targetContacts: number;
  targetWinRate:  number;
  commissionRate: number;
  notes:          string | null;
  updatedAt:      string;
}

export interface SellerGoalRequest {
  targetUnits:    number;
  targetContacts: number;
  targetWinRate:  number;
  commissionRate: number;
  notes?:         string;
}

export interface CommissionEntry {
  sellerUid:        string;
  sellerName:       string;
  role:             string;
  wonCount:         number;
  totalSales:       number;
  commissionRate:   number;
  commissionAmount: number;
}
