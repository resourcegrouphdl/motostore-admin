import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule }  from '@angular/forms';
import { RouterLink }   from '@angular/router';
import { WhatsAppService } from '../../services/whatsapp.service';
import {
  BROADCAST_SEGMENTS, BroadcastResult, BroadcastSegment,
  WaTemplateDefinition, WA_TEMPLATES,
} from '../../models/whatsapp.model';

type BroadcastStep = 'config' | 'preview' | 'done';

@Component({
  selector:    'app-broadcast',
  standalone:  true,
  imports:     [FormsModule, RouterLink],
  templateUrl: './broadcast.component.html',
  styleUrl:    './broadcast.component.scss',
})
export class BroadcastComponent {
  private svc = inject(WhatsAppService);

  // ── State ──────────────────────────────────────────────────────
  step           = signal<BroadcastStep>('config');
  segment        = signal<BroadcastSegment>('OVERDUE_DEBT');
  templateName   = signal<string>(WA_TEMPLATES[0].name);
  templateVars   = signal<Record<string, string>>({});
  sending        = signal(false);
  sendError      = signal('');
  result         = signal<BroadcastResult | null>(null);

  // ── Segment count (fetched from BE) ───────────────────────────
  segmentCountLoading = signal(false);
  segmentCounts       = signal<Partial<Record<BroadcastSegment, number>>>({});

  // ── Done stats (animated) ──────────────────────────────────────
  animSent   = signal(0);
  animFailed = signal(0);
  animTotal  = signal(0);

  // ── Computed ───────────────────────────────────────────────────
  selectedSegment = computed(() =>
    BROADCAST_SEGMENTS.find(s => s.value === this.segment()) ?? BROADCAST_SEGMENTS[0]
  );

  selectedTemplate = computed<WaTemplateDefinition>(() =>
    WA_TEMPLATES.find(t => t.name === this.templateName()) ?? WA_TEMPLATES[0]
  );

  allVarsFilled = computed(() => {
    const tmpl = this.selectedTemplate();
    const vars = this.templateVars();
    return tmpl.variables.every((_, i) => !!vars[`${i + 1}`]?.trim());
  });

  previewText = computed(() => {
    let body = this.selectedTemplate().body;
    const vars = this.templateVars();
    this.selectedTemplate().variables.forEach((_, i) => {
      const key = `${i + 1}`;
      body = body.replace(`{{${key}}}`, vars[key] || `[${this.selectedTemplate().variables[i]}]`);
    });
    return body;
  });

  currentCount = computed(() =>
    this.segmentCounts()[this.segment()] ?? null
  );

  // ── Constants ──────────────────────────────────────────────────
  readonly BROADCAST_SEGMENTS = BROADCAST_SEGMENTS;
  readonly WA_TEMPLATES       = WA_TEMPLATES;

  // ── Step navigation ────────────────────────────────────────────
  selectTemplate(name: string) {
    this.templateName.set(name);
    const tmpl = WA_TEMPLATES.find(t => t.name === name)!;
    const vars: Record<string, string> = {};
    tmpl.variables.forEach((_, i) => vars[`${i + 1}`] = '');
    this.templateVars.set(vars);
  }

  setVar(key: string, value: string) {
    this.templateVars.update(v => ({ ...v, [key]: value }));
  }

  onSegmentChange(seg: BroadcastSegment) {
    this.segment.set(seg);
    this.loadSegmentCount(seg);
  }

  goToPreview() {
    const seg = this.segment();
    if (this.segmentCounts()[seg] === undefined) {
      this.loadSegmentCount(seg);
    }
    this.step.set('preview');
  }

  backToConfig() {
    this.step.set('config');
    this.sendError.set('');
  }

  // ── Send broadcast ─────────────────────────────────────────────
  sendBroadcast() {
    if (!this.allVarsFilled() || this.sending()) return;
    this.sending.set(true);
    this.sendError.set('');
    this.svc.broadcast({
      segment:      this.segment(),
      templateName: this.templateName(),
      variables:    this.templateVars(),
    }).subscribe({
      next: res => {
        this.result.set(res);
        this.step.set('done');
        this.sending.set(false);
        this.animateStats(res);
      },
      error: e => {
        this.sendError.set(e?.error?.message ?? 'Error al enviar el broadcast.');
        this.sending.set(false);
      },
    });
  }

  // ── Reset ──────────────────────────────────────────────────────
  newBroadcast() {
    this.step.set('config');
    this.segment.set('OVERDUE_DEBT');
    this.templateName.set(WA_TEMPLATES[0].name);
    this.templateVars.set({});
    this.result.set(null);
    this.sendError.set('');
    this.animSent.set(0);
    this.animFailed.set(0);
    this.animTotal.set(0);
  }

  // ── Helpers ────────────────────────────────────────────────────
  private loadSegmentCount(seg: BroadcastSegment) {
    if (this.segmentCounts()[seg] !== undefined) return;
    this.segmentCountLoading.set(true);
    this.svc.getSegmentCount(seg).subscribe({
      next: res => {
        this.segmentCounts.update(c => ({ ...c, [seg]: res.count }));
        this.segmentCountLoading.set(false);
      },
      error: () => this.segmentCountLoading.set(false),
    });
  }

  /** Countup animation for done stats (ease-out cubic, 700ms). */
  private animateStats(res: BroadcastResult) {
    this.countUp(this.animSent,   res.sent,   700);
    this.countUp(this.animFailed, res.failed, 700);
    this.countUp(this.animTotal,  res.total,  700);
  }

  private countUp(sig: WritableSignal<number>, target: number, duration: number) {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      sig.set(Math.round(target * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
