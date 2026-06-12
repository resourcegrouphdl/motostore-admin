import { Component, inject, OnInit, signal } from '@angular/core';
import { SettingsService } from '../settings.service';
import { FintechConfig } from '../settings.model';

@Component({
  selector: 'app-fintechs-config',
  standalone: true,
  imports: [],
  templateUrl: './fintechs-config.component.html',
  styleUrl:    './fintechs-config.component.scss',
})
export class FintechsConfigComponent implements OnInit {

  private svc = inject(SettingsService);

  loading   = signal(true);
  error     = signal('');
  fintechs  = signal<FintechConfig[]>([]);
  toggling  = signal<string | null>(null);

  ngOnInit() {
    this.svc.getFintechs().subscribe({
      next: list => { this.fintechs.set(list); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar la configuración de fintechs.'); this.loading.set(false); },
    });
  }

  toggle(f: FintechConfig) {
    if (this.toggling()) return;
    this.toggling.set(f.code);
    this.svc.toggleFintech(f.code).subscribe({
      next: updated => {
        this.fintechs.update(list => list.map(x => x.code === updated.code ? updated : x));
        this.toggling.set(null);
      },
      error: () => this.toggling.set(null),
    });
  }
}
