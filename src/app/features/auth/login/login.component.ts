import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TenantSessionService, TenantInfo } from '../../../core/services/tenant-session.service';
import { TenantsApiService } from '../../../core/services/tenants-api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth          = inject(AuthService);
  private router        = inject(Router);
  private tenantSession = inject(TenantSessionService);
  private tenantsApi    = inject(TenantsApiService);

  // ── Login ──────────────────────────────────────────────────────
  form = new FormGroup({
    email:    new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  loading  = signal(false);
  error    = signal('');
  hidePass = signal(true);

  // ── Tenant picker ──────────────────────────────────────────────
  tenantPickerMode  = signal(false);
  availableTenants  = signal<TenantInfo[]>([]);

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      await this.resolveAndNavigate();
    } catch {
      this.error.set('Email o contraseña incorrectos.');
    } finally {
      this.loading.set(false);
    }
  }

  selectTenant(info: TenantInfo): void {
    this.tenantSession.select(info.tenantSlug);
    this.router.navigate(['/staff']);
  }

  private async resolveAndNavigate(): Promise<void> {
    try {
      const tenants = await firstValueFrom(this.tenantsApi.getMyTenants());
      this.tenantSession.tenants.set(tenants);

      if (tenants.length === 1) {
        this.tenantSession.select(tenants[0].tenantSlug);
        this.router.navigate(['/staff']);
      } else if (tenants.length > 1) {
        this.availableTenants.set(tenants);
        this.tenantPickerMode.set(true);
      } else {
        // Sin asignaciones: usar fallback del environment (dev) o mostrar error
        if (environment.tenantSlug) {
          this.tenantSession.select(environment.tenantSlug);
          this.router.navigate(['/staff']);
        } else {
          this.error.set('Tu cuenta no está asignada a ninguna tienda. Contacta al administrador.');
        }
      }
    } catch {
      // Endpoint no disponible (ej: backend sin migración): fallback a env
      if (environment.tenantSlug) {
        this.tenantSession.select(environment.tenantSlug);
        this.router.navigate(['/staff']);
      } else {
        this.router.navigate(['/staff']);
      }
    }
  }

  // ── Recuperar contraseña ───────────────────────────────────────
  forgotMode    = signal(false);
  resetSent     = signal(false);
  resetLoading  = signal(false);
  resetError    = signal('');
  resetEmail    = new FormControl('', [Validators.required, Validators.email]);

  enterForgot() {
    this.forgotMode.set(true);
    // Pre-fill with email already typed in the login form
    if (this.form.value.email) {
      this.resetEmail.setValue(this.form.value.email);
    }
  }

  backToLogin() {
    this.forgotMode.set(false);
    this.resetSent.set(false);
    this.resetError.set('');
    this.resetEmail.reset();
  }

  async onForgotPassword() {
    if (this.resetEmail.invalid) {
      this.resetEmail.markAsTouched();
      return;
    }
    this.resetLoading.set(true);
    this.resetError.set('');
    try {
      await this.auth.sendPasswordReset(this.resetEmail.value!);
      this.resetSent.set(true);
    } catch {
      this.resetError.set('No se pudo enviar el correo. Intenta de nuevo.');
    } finally {
      this.resetLoading.set(false);
    }
  }
}
