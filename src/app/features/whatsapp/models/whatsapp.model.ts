export type ConversationStatus = 'OPEN' | 'CLOSED';
export type MessageDirection   = 'INBOUND' | 'OUTBOUND';
export type MessageStatus      = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type MessageType        = 'TEXT' | 'TEMPLATE' | 'IMAGE' | 'DOCUMENT';
export type BroadcastSegment   = 'ALL_CLIENTS' | 'OVERDUE_DEBT' | 'CREDIT_APPROVED' | 'MAINTENANCE_DUE';

export interface WaConversation {
  id:            string;
  phone:         string;
  clientName:    string | null;
  lastMessage:   string | null;
  lastMessageAt: string | null;
  unreadCount:   number;
  status:        ConversationStatus;
}

export interface WaMessage {
  id:              string;
  conversationId:  string;
  direction:       MessageDirection;
  type:            MessageType;
  content:         string;
  templateName:    string | null;
  metaMessageId:   string | null;
  status:          MessageStatus;
  createdAt:       string;
}

export interface SendReplyRequest   { text: string; }
export interface SendTemplateRequest { phone: string; templateName: string; variables: Record<string, string>; }

export interface BroadcastRequest {
  segment:      BroadcastSegment;
  templateName: string;
  variables:    Record<string, string>;
}

export interface BroadcastResult { sent: number; failed: number; total: number; }

export interface WaTemplateDefinition {
  name:        string;
  displayName: string;
  body:        string;
  variables:   string[];
}

export const WA_TEMPLATES: WaTemplateDefinition[] = [
  {
    name: 'payment_overdue', displayName: 'Cuota vencida',
    body: 'Hola {{1}}, tienes una cuota vencida de S/ {{2}} con {{3}} días de mora. Comunícate con nosotros para regularizar.',
    variables: ['Nombre cliente', 'Monto (S/)', 'Días mora'],
  },
  {
    name: 'credit_approved', displayName: 'Crédito aprobado',
    body: 'Hola {{1}}, ¡tu crédito de S/ {{2}} a {{3}} meses fue aprobado! Visítanos para coordinar el desembolso.',
    variables: ['Nombre cliente', 'Monto aprobado (S/)', 'Plazo (meses)'],
  },
  {
    name: 'documents_requested', displayName: 'Documentos requeridos',
    body: 'Hola {{1}}, necesitamos los siguientes documentos para continuar: {{2}}. Súbelos en el portal en línea.',
    variables: ['Nombre cliente', 'Lista de documentos'],
  },
  {
    name: 'sale_confirmed', displayName: 'Venta confirmada',
    body: 'Hola {{1}}, tu compra de {{2}} está confirmada. Te avisaremos cuando esté lista para entrega. ¡Gracias!',
    variables: ['Nombre cliente', 'Modelo de moto'],
  },
  {
    name: 'reservation_expiring', displayName: 'Reserva por vencer',
    body: 'Hola {{1}}, tu reserva vence el {{2}}. ¿Deseas continuar con la compra? Contáctanos para no perderla.',
    variables: ['Nombre cliente', 'Fecha de vencimiento'],
  },
];

export const BROADCAST_SEGMENTS: Array<{ value: BroadcastSegment; label: string; description: string }> = [
  { value: 'ALL_CLIENTS',    label: 'Todos los clientes',         description: 'Todos los clientes con número de WhatsApp registrado' },
  { value: 'OVERDUE_DEBT',   label: 'Clientes en mora',           description: 'Clientes con cuotas vencidas (cobranza activa)' },
  { value: 'CREDIT_APPROVED', label: 'Créditos aprobados',        description: 'Créditos aprobados pendientes de desembolso' },
  { value: 'MAINTENANCE_DUE', label: 'Mantenimiento preventivo',  description: 'Clientes con compra hace 6+ meses sin OT reciente' },
];

export const MESSAGE_STATUS_LABEL: Record<MessageStatus, string> = {
  SENT:      'Enviado',
  DELIVERED: 'Entregado',
  READ:      'Leído',
  FAILED:    'Fallido',
};
