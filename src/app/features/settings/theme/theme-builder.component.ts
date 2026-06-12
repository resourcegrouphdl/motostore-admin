import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { catchError, of } from 'rxjs';
import { ThemeService } from './theme.service';
import {
  ThemeConfig, RadiusPreset,
  CURATED_FONTS, RADIUS_PRESETS, DEFAULT_THEME,
} from './theme.model';

@Component({
  selector: 'app-theme-builder',
  standalone: true,
  templateUrl: './theme-builder.component.html',
  styleUrl: './theme-builder.component.scss',
})
export class ThemeBuilderComponent implements OnInit {
  private doc     = inject(DOCUMENT);
  private service = inject(ThemeService);

  readonly CURATED_FONTS   = CURATED_FONTS;
  readonly RADIUS_PRESETS  = RADIUS_PRESETS;

  // — Draft signals
  primaryColor    = signal(DEFAULT_THEME.primaryColor);
  backgroundColor = signal(DEFAULT_THEME.backgroundColor);
  textColor       = signal(DEFAULT_THEME.textColor);
  fontFamily      = signal(DEFAULT_THEME.fontFamily);
  borderRadius    = signal<RadiusPreset>(DEFAULT_THEME.borderRadius);

  // — Persisted state
  savedTheme = signal<ThemeConfig>({ ...DEFAULT_THEME });

  // — UI states
  saveState    = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  showToast    = signal(false);
  toastHiding  = signal(false);
  fontChanging = signal(false);
  swatchAnim   = signal<'primary' | 'background' | 'text' | null>(null);

  // — Computed
  isDirty = computed(() => {
    const s = this.savedTheme();
    return this.primaryColor()    !== s.primaryColor
        || this.backgroundColor() !== s.backgroundColor
        || this.textColor()       !== s.textColor
        || this.fontFamily()      !== s.fontFamily
        || this.borderRadius()    !== s.borderRadius;
  });

  canSave = computed(() => this.isDirty() && this.saveState() === 'idle');

  mockRadius = computed(() =>
    RADIUS_PRESETS.find(r => r.key === this.borderRadius())!.px
  );

  mockFont = computed(() =>
    `"${this.fontFamily()}", system-ui, sans-serif`
  );

  brandContrast   = computed(() => this.contrastRatio(this.primaryColor(), '#ffffff'));
  brandContrastOk = computed(() => this.brandContrast() >= 4.5);
  textContrast    = computed(() => this.contrastRatio(this.textColor(), this.backgroundColor()));
  textContrastOk  = computed(() => this.textContrast() >= 4.5);

  ngOnInit(): void {
    this.loadGoogleFonts();
    this.service.getTheme().pipe(catchError(() => of(null))).subscribe(theme => {
      if (theme) this.applyTheme(theme);
    });
  }

  setColor(field: 'primary' | 'background' | 'text', hex: string): void {
    switch (field) {
      case 'primary':    this.primaryColor.set(hex);    break;
      case 'background': this.backgroundColor.set(hex); break;
      case 'text':       this.textColor.set(hex);       break;
    }
  }

  onColorPicker(field: 'primary' | 'background' | 'text', event: Event): void {
    const hex = (event.target as HTMLInputElement).value;
    this.setColor(field, hex);
    this.swatchAnim.set(field);
    setTimeout(() => this.swatchAnim.set(null), 400);
  }

  onHexInput(field: 'primary' | 'background' | 'text', event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      this.setColor(field, val);
    }
  }

  setFont(family: string): void {
    if (this.fontFamily() === family) return;
    this.fontChanging.set(true);
    setTimeout(() => {
      this.fontFamily.set(family);
      setTimeout(() => this.fontChanging.set(false), 80);
    }, 60);
  }

  saveTheme(): void {
    if (!this.canSave()) return;
    this.saveState.set('loading');
    const config: ThemeConfig = {
      primaryColor:    this.primaryColor(),
      backgroundColor: this.backgroundColor(),
      textColor:       this.textColor(),
      fontFamily:      this.fontFamily(),
      borderRadius:    this.borderRadius(),
    };
    this.service.updateTheme(config).subscribe({
      next: () => {
        this.savedTheme.set({ ...config });
        this.saveState.set('success');
        this.showToast.set(true);
        setTimeout(() => {
          this.toastHiding.set(true);
          setTimeout(() => { this.showToast.set(false); this.toastHiding.set(false); }, 200);
        }, 3000);
        setTimeout(() => this.saveState.set('idle'), 2200);
      },
      error: () => {
        this.saveState.set('error');
        setTimeout(() => this.saveState.set('idle'), 3000);
      },
    });
  }

  discardChanges(): void {
    const s = this.savedTheme();
    this.primaryColor.set(s.primaryColor);
    this.backgroundColor.set(s.backgroundColor);
    this.textColor.set(s.textColor);
    this.fontFamily.set(s.fontFamily);
    this.borderRadius.set(s.borderRadius);
  }

  private applyTheme(t: ThemeConfig): void {
    this.savedTheme.set({ ...t });
    this.primaryColor.set(t.primaryColor);
    this.backgroundColor.set(t.backgroundColor);
    this.textColor.set(t.textColor);
    this.fontFamily.set(t.fontFamily);
    this.borderRadius.set(t.borderRadius);
  }

  private getLuminance(hex: string): number {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    const lin = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  contrastRatio(hex1: string, hex2: string): number {
    const l1 = this.getLuminance(hex1);
    const l2 = this.getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker  = Math.min(l1, l2);
    return Math.round(((lighter + 0.05) / (darker + 0.05)) * 10) / 10;
  }

  private loadGoogleFonts(): void {
    if (this.doc.getElementById('tb-google-fonts')) return;
    const params = CURATED_FONTS.map(f => `family=${f.googleParam}`).join('&');
    const link = this.doc.createElement('link');
    link.id   = 'tb-google-fonts';
    link.rel  = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
    this.doc.head.appendChild(link);
  }
}
