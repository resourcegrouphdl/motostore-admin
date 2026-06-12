import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../settings.service';
import { BillingSetting, BillingSettingRequest, FACTURADOR_PROVIDERS } from '../settings.model';

@Component({
  selector: 'app-billing-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './billing-config.component.html',
  styleUrl:    './billing-config.component.scss',
})
export class BillingConfigComponent implements OnInit {

  private svc = inject(SettingsService);

  loading    = signal(true);
  saving     = signal(false);
  error      = signal('');
  saveOk     = signal(false);

  form: BillingSettingRequest = this.blank();

  revealApiKey = signal(false);

  readonly PROVIDERS = FACTURADOR_PROVIDERS;

  ngOnInit() {
    this.svc.getBilling().subscribe({
      next: b => { this.fromResponse(b); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  save() {
    this.saving.set(true);
    this.saveOk.set(false);
    this.error.set('');
    const req: BillingSettingRequest = {
      ...this.form,
      ruc:             this.form.ruc?.trim()             || undefined,
      razonSocial:     this.form.razonSocial?.trim()     || undefined,
      direccionFiscal: this.form.direccionFiscal?.trim() || undefined,
      facturadorApiUrl:this.form.facturadorApiUrl?.trim()|| undefined,
      facturadorApiKey:this.form.facturadorApiKey?.trim()|| undefined,
    };
    this.svc.updateBilling(req).subscribe({
      next: b => {
        this.fromResponse(b);
        this.saving.set(false);
        this.saveOk.set(true);
        setTimeout(() => this.saveOk.set(false), 3000);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Error al guardar la configuración.');
        this.saving.set(false);
      },
    });
  }

  private fromResponse(b: BillingSetting) {
    this.form = {
      ruc:                b.ruc             ?? '',
      razonSocial:        b.razonSocial     ?? '',
      direccionFiscal:    b.direccionFiscal ?? '',
      boletaSerie:        b.boletaSerie,
      facturaSerie:       b.facturaSerie,
      facturadorProvider: b.facturadorProvider ?? '',
      facturadorApiUrl:   b.facturadorApiUrl   ?? '',
      facturadorApiKey:   '',
    };
  }

  private blank(): BillingSettingRequest {
    return { ruc: '', razonSocial: '', direccionFiscal: '',
             boletaSerie: 'B001', facturaSerie: 'F001',
             facturadorProvider: '', facturadorApiUrl: '', facturadorApiKey: '' };
  }
}
