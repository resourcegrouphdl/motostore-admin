import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface StoreProfile {
  brandName:      string | null;
  contactPhone:   string | null;
  contactEmail:   string | null;
  contactAddress: string | null;
  whatsappNumber: string | null;
  facebookUrl:    string | null;
  instagramUrl:   string | null;
}

interface RuntimeConfig {
  id:          string;
  slug:        string;
  name:        string;
  countryCode: string;
  plan:        string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl:    './profile.component.scss',
})
export class ProfileComponent implements OnInit {

  private http    = inject(HttpClient);
  private profUrl = `${environment.apiUrl}/api/v1/admin/profile`;
  private cfgUrl  = `${environment.apiUrl}/api/v1/config`;

  // ── State ────────────────────────────────────────────────────────
  loading    = signal(true);
  saving     = signal(false);
  error      = signal('');
  saved      = signal(false);
  tenantInfo = signal<RuntimeConfig | null>(null);

  form: StoreProfile = {
    brandName:      '',
    contactPhone:   '',
    contactEmail:   '',
    contactAddress: '',
    whatsappNumber: '',
    facebookUrl:    '',
    instagramUrl:   '',
  };

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    forkJoin({
      profile: this.http.get<StoreProfile>(this.profUrl),
      config:  this.http.get<RuntimeConfig>(this.cfgUrl),
    }).subscribe({
      next: ({ profile, config }) => {
        this.form = {
          brandName:      profile.brandName      ?? '',
          contactPhone:   profile.contactPhone   ?? '',
          contactEmail:   profile.contactEmail   ?? '',
          contactAddress: profile.contactAddress ?? '',
          whatsappNumber: profile.whatsappNumber ?? '',
          facebookUrl:    profile.facebookUrl    ?? '',
          instagramUrl:   profile.instagramUrl   ?? '',
        };
        this.tenantInfo.set(config);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el perfil.');
        this.loading.set(false);
      },
    });
  }

  // ── Actions ──────────────────────────────────────────────────────
  save() {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.saved.set(false);

    this.http.patch<StoreProfile>(this.profUrl, this.form).subscribe({
      next: updated => {
        this.form = {
          brandName:      updated.brandName      ?? '',
          contactPhone:   updated.contactPhone   ?? '',
          contactEmail:   updated.contactEmail   ?? '',
          contactAddress: updated.contactAddress ?? '',
          whatsappNumber: updated.whatsappNumber ?? '',
          facebookUrl:    updated.facebookUrl    ?? '',
          instagramUrl:   updated.instagramUrl   ?? '',
        };
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.error.set('Error al guardar. Intenta nuevamente.');
        this.saving.set(false);
      },
    });
  }

  readonly PLAN_LABEL: Record<string, string> = {
    STARTER:     'Starter',
    PROFESSIONAL:'Professional',
    ENTERPRISE:  'Enterprise',
  };
}
