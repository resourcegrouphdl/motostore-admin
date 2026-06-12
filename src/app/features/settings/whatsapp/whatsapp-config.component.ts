import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../settings.service';
import { WhatsappConfig, WhatsappConfigRequest } from '../settings.model';

@Component({
  selector: 'app-whatsapp-config',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './whatsapp-config.component.html',
  styleUrl:    './whatsapp-config.component.scss',
})
export class WhatsappConfigComponent implements OnInit {

  private svc = inject(SettingsService);

  loading      = signal(true);
  saving       = signal(false);
  saveOk       = signal(false);
  error        = signal('');
  current      = signal<WhatsappConfig | null>(null);

  showToken    = signal(false);
  showSecret   = signal(false);

  form: WhatsappConfigRequest & { accessToken: string; appSecret: string } = this.blank();

  ngOnInit() {
    this.svc.getWhatsapp().subscribe({
      next:  cfg  => { this.fromResponse(cfg); this.loading.set(false); },
      error: ()   => { this.loading.set(false); },
    });
  }

  save() {
    this.saving.set(true);
    this.saveOk.set(false);
    this.error.set('');

    const req: WhatsappConfigRequest = {
      phoneNumberId:      this.form.phoneNumberId?.trim()      || undefined,
      accessToken:        this.form.accessToken?.trim()        || undefined,
      appSecret:          this.form.appSecret?.trim()          || undefined,
      webhookVerifyToken: this.form.webhookVerifyToken?.trim() || undefined,
      businessName:       this.form.businessName?.trim()       || undefined,
      isActive:           this.form.isActive,
    };

    this.svc.updateWhatsapp(req).subscribe({
      next: cfg => {
        this.fromResponse(cfg);
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

  private fromResponse(cfg: WhatsappConfig) {
    this.current.set(cfg);
    this.form = {
      phoneNumberId:      cfg.phoneNumberId      ?? '',
      accessToken:        '',
      appSecret:          '',
      webhookVerifyToken: cfg.webhookVerifyToken  ?? '',
      businessName:       cfg.businessName        ?? '',
      isActive:           cfg.isActive,
    };
  }

  private blank(): WhatsappConfigRequest & { accessToken: string; appSecret: string } {
    return { phoneNumberId: '', accessToken: '', appSecret: '',
             webhookVerifyToken: '', businessName: '', isActive: false };
  }
}
