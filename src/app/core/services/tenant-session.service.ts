import { Injectable, signal } from '@angular/core';

export interface TenantInfo {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  role: string;
}

/**
 * Almacena el tenant seleccionado en la sesión actual.
 * Persiste el slug elegido en localStorage para sobrevivir
 * recargas de página sin perder el contexto de tenant.
 */
@Injectable({ providedIn: 'root' })
export class TenantSessionService {
  private static readonly STORAGE_KEY = 'motostore_tenant_slug';

  /** Slug del tenant activo. Null = no hay tenant seleccionado. */
  readonly slug = signal<string | null>(
    localStorage.getItem(TenantSessionService.STORAGE_KEY)
  );

  /** Lista de tenants disponibles cargada tras el login. */
  readonly tenants = signal<TenantInfo[]>([]);

  select(tenantSlug: string): void {
    this.slug.set(tenantSlug);
    localStorage.setItem(TenantSessionService.STORAGE_KEY, tenantSlug);
  }

  clear(): void {
    this.slug.set(null);
    this.tenants.set([]);
    localStorage.removeItem(TenantSessionService.STORAGE_KEY);
  }
}
