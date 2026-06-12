export interface BillingSetting {
  id:                 string;
  ruc:                string | null;
  razonSocial:        string | null;
  direccionFiscal:    string | null;
  boletaSerie:        string;
  facturaSerie:       string;
  facturadorProvider: string | null;
  facturadorApiUrl:   string | null;
  hasApiKey:          boolean;
  updatedAt:          string;
}

export interface BillingSettingRequest {
  ruc?:                string;
  razonSocial?:        string;
  direccionFiscal?:    string;
  boletaSerie?:        string;
  facturaSerie?:       string;
  facturadorProvider?: string;
  facturadorApiUrl?:   string;
  facturadorApiKey?:   string;
}

export interface FintechConfig {
  id:          string;
  code:        string;
  name:        string;
  description: string | null;
  isEnabled:   boolean;
  sortOrder:   number;
  updatedAt:   string;
}

export interface WhatsappConfig {
  id:                 string;
  phoneNumberId:      string | null;
  hasAccessToken:     boolean;
  hasAppSecret:       boolean;
  webhookVerifyToken: string | null;
  businessName:       string | null;
  isActive:           boolean;
  updatedAt:          string;
}

export interface WhatsappConfigRequest {
  phoneNumberId?:      string;
  accessToken?:        string;
  appSecret?:          string;
  webhookVerifyToken?: string;
  businessName?:       string;
  isActive:            boolean;
}

export const FACTURADOR_PROVIDERS = [
  { value: '',              label: '— Sin integración —' },
  { value: 'SUNAT_DIRECT',  label: 'SUNAT Directo (SOAP)' },
  { value: 'NUBEFACT',      label: 'Nubefact (OSE)' },
  { value: 'EFACT',         label: 'Efact.pe (OSE)' },
];
