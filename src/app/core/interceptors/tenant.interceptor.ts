import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TenantSessionService } from '../services/tenant-session.service';

/**
 * Agrega el header X-Tenant-Slug a todas las requests al backend.
 *
 * Orden de resolución:
 *   1. TenantSessionService.slug() — slug elegido tras el login (persiste en localStorage)
 *   2. environment.tenantSlug — fallback para dev local
 *
 * En producción el slug siempre viene de TenantSessionService (cargado
 * desde /api/v1/me/tenants en el login). La dependencia de environment
 * se mantiene solo para facilitar el desarrollo local.
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const tenantSession = inject(TenantSessionService);
  const slug = tenantSession.slug() ?? environment.tenantSlug ?? '';

  if (!slug) return next(req);

  return next(req.clone({ setHeaders: { 'X-Tenant-Slug': slug } }));
};
