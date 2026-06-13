import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  // ── Login ──────────────────────────────────────────────────────
  form = new FormGroup({
    email:    new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  loading  = signal(false);
  error    = signal('');
  hidePass = signal(true);

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/staff']);
    } catch {
      this.error.set('Email o contraseña incorrectos.');
    } finally {
      this.loading.set(false);
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
