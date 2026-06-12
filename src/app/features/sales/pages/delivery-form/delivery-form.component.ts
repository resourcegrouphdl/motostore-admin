import {
  Component, computed, effect, ElementRef, inject, Input, OnDestroy, OnInit,
  output, signal, ViewChild,
} from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models/sale.model';
import {
  DELIVERY_PHOTO_SLOTS, DeliveryRequest, PhotoSlot,
} from '../../models/sale.model';

type Step = 1 | 2 | 3;

@Component({
  selector: 'app-delivery-form',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, FormsModule],
  templateUrl: './delivery-form.component.html',
  styleUrl:    './delivery-form.component.scss',
})
export class DeliveryFormComponent implements OnInit, OnDestroy {

  @Input({ required: true }) sale!: Sale;
  @Input() customerName = '';
  @Input() motoName     = '';

  readonly closed    = output<void>();
  readonly delivered = output<void>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private saleSvc = inject(SaleService);

  // ── Wizard state ─────────────────────────────────────────────────────
  step       = signal<Step>(1);
  submitting = signal(false);
  error      = signal('');

  // ── Step 1 (read-only — just confirmation) ────────────────────────
  readonly deliveryDate = new Date();

  // ── Step 2: photos ────────────────────────────────────────────────
  photoSlots = signal<PhotoSlot[]>(
    DELIVERY_PHOTO_SLOTS.map(s => ({ ...s, dataUrl: null, uploading: false, error: null }))
  );

  requiredUploaded = computed(() =>
    this.photoSlots()
      .filter(s => s.required)
      .every(s => s.dataUrl !== null)
  );

  // ── Step 3: signature + form ───────────────────────────────────────
  receivedByName = signal('');
  receivedByDni  = signal('');
  odometerKm     = signal<number | null>(null);
  notes          = signal('');

  signatureEmpty  = signal(true);
  signatureShake  = signal(false);
  private drawing = false;
  private ctx!: CanvasRenderingContext2D;

  canConfirm = computed(() =>
    this.requiredUploaded() &&
    !this.signatureEmpty() &&
    this.receivedByName().trim().length > 0 &&
    isDniValid(this.receivedByDni())
  );

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit() {
    // pre-fill name from customer if available
    if (this.customerName) {
      this.receivedByName.set(this.customerName);
    }
  }

  ngAfterViewInit() {
    if (this.step() === 3) this.initCanvas();
  }

  ngOnDestroy() {
    this.detachCanvasListeners();
  }

  // ── Navigation ────────────────────────────────────────────────────
  next() {
    if (this.step() === 1) this.step.set(2);
    else if (this.step() === 2 && this.requiredUploaded()) {
      this.step.set(3);
      // canvas init needs a tick for the DOM to render
      setTimeout(() => this.initCanvas(), 50);
    }
  }

  back() {
    if (this.step() === 2) this.step.set(1);
    else if (this.step() === 3) this.step.set(2);
  }

  stepLabel(): string {
    const labels: Record<Step, string> = {
      1: 'Verificar datos',
      2: 'Fotos del estado',
      3: 'Firma y confirmar',
    };
    return labels[this.step()];
  }

  // ── Photo slots ───────────────────────────────────────────────────
  onPhotoSelected(event: Event, slotKey: string) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    this.photoSlots.update(slots =>
      slots.map(s => s.key === slotKey ? { ...s, uploading: true, error: null } : s)
    );

    reader.onload = () => {
      this.photoSlots.update(slots =>
        slots.map(s => s.key === slotKey
          ? { ...s, dataUrl: reader.result as string, uploading: false }
          : s)
      );
    };
    reader.onerror = () => {
      this.photoSlots.update(slots =>
        slots.map(s => s.key === slotKey
          ? { ...s, uploading: false, error: 'Error al leer la foto. Intenta de nuevo.' }
          : s)
      );
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    input.value = '';
  }

  removePhoto(slotKey: string) {
    this.photoSlots.update(slots =>
      slots.map(s => s.key === slotKey
        ? { ...s, dataUrl: null, error: null }
        : s)
    );
  }

  // ── Canvas signature ──────────────────────────────────────────────
  private initCanvas() {
    const el = this.canvasRef?.nativeElement;
    if (!el) return;
    el.width  = el.offsetWidth;
    el.height = el.offsetHeight;
    this.ctx  = el.getContext('2d')!;
    this.ctx.strokeStyle = '#111';
    this.ctx.lineWidth   = 2;
    this.ctx.lineCap     = 'round';
    this.ctx.lineJoin    = 'round';
    this.attachCanvasListeners(el);
  }

  private attachCanvasListeners(el: HTMLCanvasElement) {
    el.addEventListener('mousedown',  this.onStart);
    el.addEventListener('mousemove',  this.onMove);
    el.addEventListener('mouseup',    this.onEnd);
    el.addEventListener('mouseleave', this.onEnd);
    el.addEventListener('touchstart', this.onTouchStart, { passive: false });
    el.addEventListener('touchmove',  this.onTouchMove,  { passive: false });
    el.addEventListener('touchend',   this.onEnd);
  }

  private detachCanvasListeners() {
    const el = this.canvasRef?.nativeElement;
    if (!el) return;
    el.removeEventListener('mousedown',  this.onStart);
    el.removeEventListener('mousemove',  this.onMove);
    el.removeEventListener('mouseup',    this.onEnd);
    el.removeEventListener('mouseleave', this.onEnd);
    el.removeEventListener('touchstart', this.onTouchStart);
    el.removeEventListener('touchmove',  this.onTouchMove);
    el.removeEventListener('touchend',   this.onEnd);
  }

  private onStart = (e: MouseEvent) => {
    this.drawing = true;
    const { x, y } = this.getPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  };

  private onMove = (e: MouseEvent) => {
    if (!this.drawing) return;
    const { x, y } = this.getPos(e);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    if (this.signatureEmpty()) this.signatureEmpty.set(false);
  };

  private onEnd = () => { this.drawing = false; };

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    this.drawing = true;
    const { x, y } = this.getTouchPos(touch);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.drawing) return;
    const touch = e.touches[0];
    const { x, y } = this.getTouchPos(touch);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    if (this.signatureEmpty()) this.signatureEmpty.set(false);
  };

  clearSignature() {
    if (!this.ctx) return;
    const el = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, el.width, el.height);
    this.signatureEmpty.set(true);
  }

  tryAdvanceWithSignature() {
    if (this.signatureEmpty()) {
      this.triggerShake();
    }
  }

  private triggerShake() {
    this.signatureShake.set(true);
    setTimeout(() => this.signatureShake.set(false), 350);
  }

  private getPos(e: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private getTouchPos(touch: Touch) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  private getSignatureDataUrl(): string {
    try {
      return this.canvasRef?.nativeElement?.toDataURL('image/png') ?? '';
    } catch {
      return '';
    }
  }

  // ── Submit ────────────────────────────────────────────────────────
  submit() {
    if (!this.canConfirm()) {
      if (this.signatureEmpty()) this.triggerShake();
      return;
    }

    const photos = this.photoSlots()
      .filter(s => s.dataUrl !== null)
      .map(s => s.dataUrl!);

    const payload: DeliveryRequest = {
      receivedByName: this.receivedByName().trim(),
      receivedByDni:  this.receivedByDni().trim(),
      signatureUrl:   this.getSignatureDataUrl(),
      photos,
      ...(this.odometerKm() !== null ? { odometerKm: this.odometerKm()! } : {}),
      ...(this.notes().trim()        ? { notes: this.notes().trim() }      : {}),
    };

    this.submitting.set(true);
    this.error.set('');

    this.saleSvc.registerDelivery(this.sale.id, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.delivered.emit();
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Error al registrar la entrega. Intenta de nuevo.');
        this.submitting.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  isDniValid(dni: string): boolean { return isDniValid(dni); }
  close()                          { this.closed.emit(); }
}

function isDniValid(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}
