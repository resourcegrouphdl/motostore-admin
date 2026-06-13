export type PhotoStage = 'RECEPCION' | 'TRABAJO' | 'ENTREGA';

export interface WorkOrderPhoto {
  id:         string;
  stage:      PhotoStage;
  url:        string;
  caption:    string | null;
  createdAt:  string;
}

export interface AddPhotoRequest {
  url:      string;
  stage:    PhotoStage;
  caption?: string;
}

export const STAGE_LABEL: Record<PhotoStage, string> = {
  RECEPCION: 'Recepción',
  TRABAJO:   'En trabajo',
  ENTREGA:   'Entrega',
};

export const PHOTO_STAGES: PhotoStage[] = ['RECEPCION', 'TRABAJO', 'ENTREGA'];

export type WorkOrderStatus =
  | 'AGENDADA' | 'RECIBIDA' | 'EN_DIAGNOSTICO' | 'PRESUPUESTADA'
  | 'APROBADA'  | 'EN_TRABAJO' | 'LISTA' | 'ENTREGADA' | 'CANCELADA';

export type WorkOrderTipo =
  | 'MANTENIMIENTO_PREVENTIVO' | 'CORRECTIVO' | 'GARANTIA' | 'PERITAJE' | 'PREPARACION';

export type WorkOrderItemTipo = 'SERVICIO' | 'REPUESTO';

export interface WorkOrderItem {
  id:             string;
  workOrderId:    string;
  tipo:           WorkOrderItemTipo;
  descripcion:    string;
  repuestoId:     string | null;
  cantidad:       number;
  precioUnitario: number;
  total:          number;
  isPresupuesto:  boolean;
  createdAt:      string;
}

export interface WorkOrder {
  id:                     string;
  numeroOt:               string;
  customerId:             string | null;
  customerName:           string | null;
  customerPhone:          string | null;
  motoVin:                string | null;
  motoDescription:        string | null;
  tipo:                   WorkOrderTipo;
  status:                 WorkOrderStatus;
  kilometrajeEntrada:     number | null;
  fallaReportada:         string | null;
  observacionesRecepcion: string | null;
  diagnosticoMecanico:    string | null;
  totalPresupuestado:     number;
  estadoAprobacion:       'pendiente' | 'aprobado' | 'rechazado' | 'parcial';
  mecanicoUid:            string | null;
  tiempoRealHoras:        number | null;
  kilometrajeSalida:      number | null;
  proximaRevisionKm:      number | null;
  fechaAgendada:          string | null;
  fechaRecepcion:         string;
  fechaEntregaPrometida:  string | null;
  fechaEntregaReal:       string | null;
  createdBy:              string;
  createdAt:              string;
  updatedAt:              string;
  items:                  WorkOrderItem[];
  notificationSent?:      boolean | null;
}

export interface CreateWorkOrderPayload {
  customerId?:    string;
  customerName?:  string;
  customerPhone?: string;
  motoVin?:       string;
  motoDescription?: string;
  tipo:           WorkOrderTipo;
  kilometrajeEntrada?: number;
  fallaReportada?: string;
  observaciones?:  string;
}

export interface AddItemPayload {
  tipo:           WorkOrderItemTipo;
  descripcion:    string;
  repuestoId?:    string;
  cantidad:       number;
  precioUnitario: number;
  isPresupuesto:  boolean;
}

export const TIPO_LABEL: Record<WorkOrderTipo, string> = {
  MANTENIMIENTO_PREVENTIVO: 'Mant. Preventivo',
  CORRECTIVO:               'Correctivo',
  GARANTIA:                 'Garantía',
  PERITAJE:                 'Peritaje',
  PREPARACION:              'Preparación',
};

export const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  AGENDADA:       'Agendada',
  RECIBIDA:       'Recibida',
  EN_DIAGNOSTICO: 'Diagnóstico',
  PRESUPUESTADA:  'Presupuestada',
  APROBADA:       'Aprobada',
  EN_TRABAJO:     'En trabajo',
  LISTA:          'Lista',
  ENTREGADA:      'Entregada',
  CANCELADA:      'Cancelada',
};

// Valid next states for each status
export const NEXT_STATES: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  AGENDADA:       ['RECIBIDA', 'CANCELADA'],
  RECIBIDA:       ['EN_DIAGNOSTICO', 'CANCELADA'],
  EN_DIAGNOSTICO: ['PRESUPUESTADA', 'CANCELADA'],
  PRESUPUESTADA:  ['APROBADA', 'EN_TRABAJO', 'CANCELADA'],
  APROBADA:       ['EN_TRABAJO', 'CANCELADA'],
  EN_TRABAJO:     ['LISTA', 'CANCELADA'],
  LISTA:          ['ENTREGADA', 'CANCELADA'],
  ENTREGADA:      [],
  CANCELADA:      [],
};

// Sequential flow for timeline (no CANCELADA — it's a dead-end branch)
export const WORKFLOW_STEPS: WorkOrderStatus[] = [
  'AGENDADA', 'RECIBIDA', 'EN_DIAGNOSTICO',
  'PRESUPUESTADA', 'APROBADA', 'EN_TRABAJO', 'LISTA', 'ENTREGADA',
];

export const ACTIVE_STATUSES: WorkOrderStatus[] = [
  'AGENDADA', 'RECIBIDA', 'EN_DIAGNOSTICO', 'PRESUPUESTADA', 'APROBADA', 'EN_TRABAJO',
];

export const FILTER_STATUSES: Array<{ value: WorkOrderStatus | ''; label: string }> = [
  { value: '',               label: 'Todas'       },
  { value: 'AGENDADA',       label: 'Agendada'    },
  { value: 'RECIBIDA',       label: 'Recibida'    },
  { value: 'EN_DIAGNOSTICO', label: 'Diagnóstico' },
  { value: 'PRESUPUESTADA',  label: 'Presupuestada'},
  { value: 'APROBADA',       label: 'Aprobada'    },
  { value: 'EN_TRABAJO',     label: 'En trabajo'  },
  { value: 'LISTA',          label: 'Lista'       },
  { value: 'ENTREGADA',      label: 'Entregada'   },
  { value: 'CANCELADA',      label: 'Cancelada'   },
];

export const TIPO_OPTIONS: WorkOrderTipo[] = [
  'MANTENIMIENTO_PREVENTIVO', 'CORRECTIVO', 'GARANTIA', 'PERITAJE', 'PREPARACION',
];
