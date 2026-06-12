import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../settings.service';
import { WhatsappConfig, BillingSetting, FintechConfig } from '../settings.model';

interface IntegrationCard {
  key:      string;
  name:     string;
  desc:     string;
  status:   'ok' | 'warn' | 'off';
  label:    string;
  route:    string;
}

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './integrations.component.html',
  styleUrl:    './integrations.component.scss',
})
export class IntegrationsComponent implements OnInit {

  private svc = inject(SettingsService);

  loading   = signal(true);
  whatsapp  = signal<WhatsappConfig | null>(null);
  billing   = signal<BillingSetting | null>(null);
  fintechs  = signal<FintechConfig[]>([]);

  cards = computed<IntegrationCard[]>(() => {
    const wa = this.whatsapp();
    const bi = this.billing();
    const fi = this.fintechs();

    return [
      {
        key:    'whatsapp',
        name:   'WhatsApp Business',
        desc:   'API de Meta Cloud para mensajes y notificaciones automáticas.',
        status: wa?.isActive ? 'ok' : wa?.phoneNumberId ? 'warn' : 'off',
        label:  wa?.isActive ? 'Conectado' : wa?.phoneNumberId ? 'Configurado, inactivo' : 'Sin configurar',
        route:  '../whatsapp',
      },
      {
        key:    'factiliza',
        name:   'Factiliza / SUNAT',
        desc:   'Facturador electrónico para boletas, facturas y guías de remisión.',
        status: bi?.facturadorProvider ? 'ok' : 'off',
        label:  bi?.facturadorProvider ?? 'Sin integración',
        route:  '../billing',
      },
      {
        key:    'firebase',
        name:   'Firebase Auth',
        desc:   'Autenticación del staff con JWT. Siempre activo.',
        status: 'ok',
        label:  'Operativo',
        route:  '',
      },
      {
        key:    'fintechs',
        name:   'Fintechs activas',
        desc:   `${fi.filter(f => f.isEnabled).length} de ${fi.length} fintechs habilitadas para crédito.`,
        status: fi.some(f => f.isEnabled) ? 'ok' : 'warn',
        label:  `${fi.filter(f => f.isEnabled).length} activas`,
        route:  '../fintechs',
      },
    ];
  });

  ngOnInit() {
    forkJoin({
      wa: this.svc.getWhatsapp().pipe(catchError(() => of(null))),
      bi: this.svc.getBilling().pipe(catchError(() => of(null))),
      fi: this.svc.getFintechs().pipe(catchError(() => of([] as FintechConfig[]))),
    }).subscribe(({ wa, bi, fi }) => {
      this.whatsapp.set(wa);
      this.billing.set(bi);
      this.fintechs.set(fi);
      this.loading.set(false);
    });
  }
}
