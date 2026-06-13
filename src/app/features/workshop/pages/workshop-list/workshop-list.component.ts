import { Component, computed, inject, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { WorkshopService } from '../../services/workshop.service';
import {
  WorkOrder, WorkOrderStatus, WorkOrderTipo,
  WorkOrderPhoto, PhotoStage,
  AddItemPayload, CreateWorkOrderPayload,
  STATUS_LABEL, TIPO_LABEL, NEXT_STATES, FILTER_STATUSES,
  ACTIVE_STATUSES, WORKFLOW_STEPS, TIPO_OPTIONS,
  STAGE_LABEL, PHOTO_STAGES,
} from '../../models/workshop.model';
import { environment } from '../../../../../environments/environment';

type DetailTab = 'resumen' | 'diagnostico' | 'entrega' | 'fotos';
type PanelMode = 'none' | 'create' | 'detail';

@Component({
  selector:    'app-workshop-list',
  standalone:  true,
  imports:     [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './workshop-list.component.html',
  styleUrl:    './workshop-list.component.scss',
})
export class WorkshopListComponent implements OnInit {
  private svc     = inject(WorkshopService);
  private storage = inject(Storage);

  // ── List state ──────────────────────────────────────────────────
  loading      = signal(true);
  error        = signal('');
  orders       = signal<WorkOrder[]>([]);
  query        = signal('');
  filterStatus = signal<WorkOrderStatus | ''>('');

  // ── Panel ────────────────────────────────────────────────────────
  panelMode     = signal<PanelMode>('none');
  selected      = signal<WorkOrder | null>(null);
  activeTab     = signal<DetailTab>('resumen');
  actionLoading = signal(false);
  actionError   = signal('');

  // ── Toast ────────────────────────────────────────────────────────
  toast      = signal<{ msg: string; type: 'ok' | 'err' | 'wa' } | null>(null);
  lastNotifSent = signal<boolean | null>(null);
  private toastTimer = 0;

  // ── Create form ──────────────────────────────────────────────────
  createForm: CreateWorkOrderPayload = this.emptyCreate();

  // ── Diagnosis ────────────────────────────────────────────────────
  diagText    = signal('');
  diagLoading = signal(false);

  // ── Items (presupuesto) ──────────────────────────────────────────
  addItemForm: AddItemPayload = this.emptyItem();
  addItemOpen  = signal(false);
  itemLoading  = signal(false);

  // ── Approval ────────────────────────────────────────────────────
  approvalLoading = signal(false);

  // ── Photos ───────────────────────────────────────────────────────
  photos        = signal<WorkOrderPhoto[]>([]);
  photosLoading = signal(false);
  uploadingStage = signal<PhotoStage | null>(null);
  uploadProgress = signal<number>(0);

  photosByStage = computed(() => {
    const all = this.photos();
    return {
      RECEPCION: all.filter(p => p.stage === 'RECEPCION'),
      TRABAJO:   all.filter(p => p.stage === 'TRABAJO'),
      ENTREGA:   all.filter(p => p.stage === 'ENTREGA'),
    } as Record<PhotoStage, WorkOrderPhoto[]>;
  });

  readonly STAGE_LABEL  = STAGE_LABEL;
  readonly PHOTO_STAGES = PHOTO_STAGES;

  // ── PDF ──────────────────────────────────────────────────────────
  pdfLoading   = signal(false);

  // ── Close form ───────────────────────────────────────────────────
  closeOpen    = signal(false);
  closeKmSalida:       number | null = null;
  closeKmProxRevision: number | null = null;
  closeHoras:          number | null = null;
  closeFirma           = '';
  closeLoading = signal(false);

  // ── Computed ─────────────────────────────────────────────────────
  filtered = computed(() => {
    let list = this.orders();
    const st = this.filterStatus();
    if (st) list = list.filter(o => o.status === st);
    const q = this.query().toLowerCase().trim();
    if (q) list = list.filter(o =>
      o.numeroOt.toLowerCase().includes(q) ||
      (o.customerName ?? '').toLowerCase().includes(q) ||
      (o.motoDescription ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  countByStatus = computed(() => {
    const m = new Map<string, number>();
    for (const o of this.orders()) m.set(o.status, (m.get(o.status) ?? 0) + 1);
    return m;
  });

  totalCount        = computed(() => this.orders().length);
  activeCount       = computed(() =>
    ACTIVE_STATUSES.reduce((acc, s) => acc + (this.countByStatus().get(s) ?? 0), 0)
  );
  pendingApproval   = computed(() => this.countByStatus().get('PRESUPUESTADA') ?? 0);
  readyDelivery     = computed(() => this.countByStatus().get('LISTA') ?? 0);

  nextStates = computed(() => {
    const sel = this.selected();
    if (!sel) return [] as WorkOrderStatus[];
    return (NEXT_STATES[sel.status] ?? []) as WorkOrderStatus[];
  });

  panelOpen = computed(() => this.panelMode() !== 'none');

  addItemTotal = computed(() =>
    (this.addItemForm.cantidad ?? 0) * (this.addItemForm.precioUnitario ?? 0)
  );

  // ── Constants exposed to template ────────────────────────────────
  readonly STATUS_LABEL    = STATUS_LABEL;
  readonly TIPO_LABEL      = TIPO_LABEL;
  readonly FILTER_STATUSES = FILTER_STATUSES;
  readonly TIPO_OPTIONS    = TIPO_OPTIONS;
  readonly WORKFLOW_STEPS  = WORKFLOW_STEPS;
  readonly trackingUrl     = `${window.location.origin.replace('4201', '4200')}/taller`;

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next:  orders => { this.orders.set(orders); this.loading.set(false); },
      error: _      => { this.error.set('No se pudieron cargar las órdenes.'); this.loading.set(false); },
    });
  }

  // ── Detail ────────────────────────────────────────────────────────
  openDetail(order: WorkOrder) {
    this.svc.getById(order.id).subscribe({
      next: full => {
        this.selected.set(full);
        this.panelMode.set('detail');
        this.activeTab.set('resumen');
        this.actionError.set('');
        this.diagText.set(full.diagnosticoMecanico ?? '');
        this.addItemOpen.set(false);
        this.closeOpen.set(false);
        this.lastNotifSent.set(null);
        this.resetCloseForm();
        this.loadPhotos(full.id);
      },
    });
  }

  private loadPhotos(orderId: string) {
    this.photosLoading.set(true);
    this.svc.getPhotos(orderId).subscribe({
      next:  ps => { this.photos.set(ps); this.photosLoading.set(false); },
      error: _  => this.photosLoading.set(false),
    });
  }

  triggerFileInput(stage: PhotoStage, input: HTMLInputElement) {
    input.dataset['stage'] = stage;
    input.click();
  }

  async onFilesSelected(event: Event, orderId: string) {
    const input = event.target as HTMLInputElement;
    const stage = (input.dataset['stage'] ?? 'RECEPCION') as PhotoStage;
    const files  = Array.from(input.files ?? []);
    if (!files.length) return;

    this.uploadingStage.set(stage);
    this.uploadProgress.set(0);

    try {
      for (const file of files) {
        const url = await this.uploadToStorage(file, orderId, stage);
        await new Promise<void>((resolve, reject) => {
          this.svc.addPhoto(orderId, { url, stage }).subscribe({
            next: photo => { this.photos.update(ps => [...ps, photo]); resolve(); },
            error: reject,
          });
        });
      }
      this.showToast(`${files.length} foto(s) subida(s)`, 'ok');
    } catch {
      this.showToast('Error al subir foto. Intenta de nuevo.', 'err');
    } finally {
      this.uploadingStage.set(null);
      input.value = '';
    }
  }

  private uploadToStorage(file: File, orderId: string, stage: string): Promise<string> {
    const slug = environment.tenantSlug || 'demo';
    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `${slug}/workshop/${orderId}/${stage}/${Date.now()}.${ext}`;
    const storageRef = ref(this.storage, path);

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed',
        snap => this.uploadProgress.set(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
        err  => reject(err),
        ()   => getDownloadURL(task.snapshot.ref).then(resolve).catch(reject)
      );
    });
  }

  deletePhoto(photo: WorkOrderPhoto) {
    const sel = this.selected();
    if (!sel) return;
    this.svc.deletePhoto(sel.id, photo.id).subscribe({
      next: () => this.photos.update(ps => ps.filter(p => p.id !== photo.id)),
      error: () => this.showToast('No se pudo eliminar la foto.', 'err'),
    });
  }

  copyTrackingLink(order: WorkOrder) {
    const url = `${this.trackingUrl}/${order.numeroOt}`;
    navigator.clipboard.writeText(url).then(() => this.showToast('Enlace de seguimiento copiado', 'ok'));
  }

  closePanel() {
    this.panelMode.set('none');
    this.selected.set(null);
  }

  setTab(tab: DetailTab) {
    this.activeTab.set(tab);
    this.actionError.set('');
    this.addItemOpen.set(false);
  }

  // ── Create ────────────────────────────────────────────────────────
  openCreate() {
    this.createForm = this.emptyCreate();
    this.actionError.set('');
    this.panelMode.set('create');
  }

  submitCreate() {
    this.actionLoading.set(true);
    this.actionError.set('');
    this.svc.create(this.createForm).subscribe({
      next: created => {
        this.orders.update(list => [created, ...list]);
        this.actionLoading.set(false);
        this.panelMode.set('none');
        this.showToast(`${created.numeroOt} creada`, 'ok');
      },
      error: e => {
        this.actionError.set(e?.error?.message ?? 'Error al crear la OT');
        this.actionLoading.set(false);
      },
    });
  }

  // ── Status transition ─────────────────────────────────────────────
  transitionStatus(status: WorkOrderStatus) {
    const sel = this.selected();
    if (!sel) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.svc.updateStatus(sel.id, status).subscribe({
      next: updated => {
        this.updateOrder(updated);
        this.actionLoading.set(false);
        const sent = updated.notificationSent === true;
        this.lastNotifSent.set(sent ? true : null);
        if (sent) {
          this.showToast(`${STATUS_LABEL[status]} — Notificación WA enviada`, 'wa');
        } else {
          this.showToast(STATUS_LABEL[status], 'ok');
        }
      },
      error: e => {
        this.actionError.set(e?.error?.message ?? 'Error al cambiar estado');
        this.actionLoading.set(false);
      },
    });
  }

  // ── Diagnosis ─────────────────────────────────────────────────────
  saveDiagnosis() {
    const sel = this.selected();
    if (!sel) return;
    this.diagLoading.set(true);
    this.actionError.set('');
    this.svc.updateDiagnosis(sel.id, this.diagText()).subscribe({
      next: updated => {
        // Auto-advance RECIBIDA → EN_DIAGNOSTICO when diagnosis is entered
        if (updated.status === 'RECIBIDA' && this.diagText().trim()) {
          this.svc.updateStatus(sel.id, 'EN_DIAGNOSTICO').subscribe({
            next: u2 => {
              this.updateOrder(u2);
              this.diagLoading.set(false);
              this.showToast('Diagnóstico guardado — en diagnóstico', 'ok');
            },
            error: () => {
              this.updateOrder(updated);
              this.diagLoading.set(false);
              this.showToast('Diagnóstico guardado', 'ok');
            },
          });
        } else {
          this.updateOrder(updated);
          this.diagLoading.set(false);
          this.showToast('Diagnóstico guardado', 'ok');
        }
      },
      error: e => {
        this.actionError.set(e?.error?.message ?? 'Error al guardar diagnóstico');
        this.diagLoading.set(false);
      },
    });
  }

  // ── Items ─────────────────────────────────────────────────────────
  submitAddItem() {
    const sel = this.selected();
    if (!sel) return;
    // Sync total before submitting
    this.addItemForm = {
      ...this.addItemForm,
    };
    this.itemLoading.set(true);
    this.svc.addItem(sel.id, this.addItemForm).subscribe({
      next: () => {
        this.svc.getById(sel.id).subscribe({
          next: full => {
            this.updateOrder(full);
            this.itemLoading.set(false);
            this.addItemOpen.set(false);
            this.addItemForm = this.emptyItem();
          },
        });
      },
      error: e => {
        this.actionError.set(e?.error?.message ?? 'Error al agregar ítem');
        this.itemLoading.set(false);
      },
    });
  }

  removeItem(itemId: string) {
    const sel = this.selected();
    if (!sel) return;
    this.svc.removeItem(sel.id, itemId).subscribe({
      next: () => {
        this.svc.getById(sel.id).subscribe({
          next: full => { this.updateOrder(full); },
        });
      },
    });
  }

  // ── Approval ──────────────────────────────────────────────────────
  setApproval(estado: 'aprobado' | 'rechazado' | 'parcial') {
    const sel = this.selected();
    if (!sel) return;
    this.approvalLoading.set(true);
    this.svc.updateApproval(sel.id, estado).subscribe({
      next: updated => {
        this.updateOrder(updated);
        this.approvalLoading.set(false);
        this.showToast('Aprobación registrada', 'ok');
      },
      error: e => {
        this.actionError.set(e?.error?.message ?? 'Error al registrar aprobación');
        this.approvalLoading.set(false);
      },
    });
  }

  // ── Close ─────────────────────────────────────────────────────────
  submitClose() {
    const sel = this.selected();
    if (!sel) return;
    this.closeLoading.set(true);
    this.actionError.set('');
    this.svc.closeOrder(sel.id, {
      kilometrajeSalida:  this.closeKmSalida     ?? undefined,
      proximaRevisionKm:  this.closeKmProxRevision ?? undefined,
      tiempoRealHoras:    this.closeHoras          ?? undefined,
      firmaEntrega:       this.closeFirma           || undefined,
    }).subscribe({
      next: updated => {
        this.updateOrder(updated);
        this.closeLoading.set(false);
        this.closeOpen.set(false);
        const sent = updated.notificationSent === true;
        this.lastNotifSent.set(sent ? true : null);
        if (sent) {
          this.showToast(`${updated.numeroOt} entregada — Notificación WA enviada`, 'wa');
        } else {
          this.showToast(`${updated.numeroOt} entregada`, 'ok');
        }
      },
      error: e => {
        this.actionError.set(e?.error?.message ?? 'Error al cerrar la OT');
        this.closeLoading.set(false);
      },
    });
  }

  // ── PDF ───────────────────────────────────────────────────────────
  downloadPdf(order: WorkOrder) {
    if (this.pdfLoading()) return;
    this.pdfLoading.set(true);
    const filename = `${order.numeroOt ?? 'OT'}.pdf`;
    this.svc.downloadPdf(order.id, filename).subscribe({
      next:  () => this.pdfLoading.set(false),
      error: () => { this.pdfLoading.set(false); this.showToast('Error al generar el PDF.', 'err'); },
    });
  }

  // ── Timeline ──────────────────────────────────────────────────────
  timelineSteps(o: WorkOrder) {
    const idx = WORKFLOW_STEPS.indexOf(o.status);
    return WORKFLOW_STEPS.map((s, i) => ({
      status: s,
      label:  STATUS_LABEL[s],
      state:  (o.status === 'CANCELADA'
        ? 'pending'
        : i < idx   ? 'done'
        : i === idx ? 'active'
        : 'pending') as 'done' | 'active' | 'pending',
    }));
  }

  // ── Helpers ───────────────────────────────────────────────────────
  today() { return new Date().getFullYear(); }

  animIdx(i: number) { return Math.min(i, 9); }

  daysAgo(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  }

  isCancelAction(s: WorkOrderStatus): boolean { return s === 'CANCELADA'; }

  isAdvanceAction(s: WorkOrderStatus): boolean {
    return s !== 'CANCELADA';
  }

  // ── Internal ─────────────────────────────────────────────────────
  private showToast(msg: string, type: 'ok' | 'err' | 'wa') {
    clearTimeout(this.toastTimer);
    this.toast.set({ msg, type });
    this.toastTimer = window.setTimeout(() => this.toast.set(null), 3500);
  }

  private updateOrder(updated: WorkOrder) {
    this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
    if (this.selected()?.id === updated.id) this.selected.set(updated);
  }

  private resetCloseForm() {
    this.closeKmSalida       = null;
    this.closeKmProxRevision = null;
    this.closeHoras          = null;
    this.closeFirma          = '';
  }

  private emptyCreate(): CreateWorkOrderPayload {
    return {
      tipo:            'CORRECTIVO',
      customerName:    '',
      motoDescription: '',
      motoVin:         '',
      fallaReportada:  '',
      observaciones:   '',
    };
  }

  private emptyItem(): AddItemPayload {
    return { tipo: 'SERVICIO', descripcion: '', cantidad: 1, precioUnitario: 0, isPresupuesto: true };
  }
}
