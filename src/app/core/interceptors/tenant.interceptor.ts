import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Agrega el header X-Tenant-Slug a todas las requests al backend.
 * - Local dev: usa environment.tenantSlug ('demo-store')
 * - Producción: deriva el slug del primer segmento del hostname (subdominio)
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // env.tenantSlug (hardcoded per-tenant build) beats subdomain extraction.
  // On Firebase Hosting the subdomain is the site ID (e.g. "motostore-admin"),
  // not the tenant slug — so env var must win when set.
  const slug = environment.tenantSlug
    || (environment.production ? extractSubdomain(window.location.hostname) : '');

  if (!slug) return next(req);

  return next(req.clone({ setHeaders: { 'X-Tenant-Slug': slug } }));
};

function extractSubdomain(hostname: string): string {
  const parts = hostname.split('.');
  return parts.length > 2 ? parts[0] : '';
}
