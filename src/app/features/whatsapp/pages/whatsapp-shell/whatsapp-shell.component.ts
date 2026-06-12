import {
  Component, computed, ElementRef, inject,
  OnDestroy, OnInit, signal, ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { WhatsAppService } from '../../services/whatsapp.service';
import { FirestoreWhatsAppService } from '../../services/firestore-whatsapp.service';
import {
  MESSAGE_STATUS_LABEL, MessageStatus,
  WaConversation, WaMessage,
  WaTemplateDefinition, WA_TEMPLATES,
} from '../../models/whatsapp.model';

@Component({
  selector:    'app-whatsapp-shell',
  standalone:  true,
  imports:     [DatePipe, FormsModule],
  templateUrl: './whatsapp-shell.component.html',
  styleUrl:    './whatsapp-shell.component.scss',
})
export class WhatsAppShellComponent implements OnInit, OnDestroy {
  private svc   = inject(WhatsAppService);
  private fsSvc = inject(FirestoreWhatsAppService);

  @ViewChild('msgContainer') msgContainerEl?: ElementRef<HTMLElement>;

  // ── Conversations ──────────────────────────────────────────────
  loadingConvs  = signal(true);
  convError     = signal('');
  conversations = signal<WaConversation[]>([]);
  query         = signal('');
  filterUnread  = signal(false);

  // ── Selected / chat ────────────────────────────────────────────
  selected        = signal<WaConversation | null>(null);
  messages        = signal<WaMessage[]>([]);
  loadingMessages = signal(false);
  msgError        = signal('');

  // ── Input ──────────────────────────────────────────────────────
  messageText = signal('');
  sending     = signal(false);
  sendError   = signal('');

  // ── Template picker ────────────────────────────────────────────
  templatePickerOpen = signal(false);
  selectedTemplate   = signal<WaTemplateDefinition | null>(null);
  templateVars       = signal<Record<string, string>>({});

  // ── Realtime status ────────────────────────────────────────────
  realtimeActive = signal(false);

  // ── Computed ───────────────────────────────────────────────────
  filteredConvs = computed(() => {
    let list = this.conversations();
    if (this.filterUnread()) list = list.filter(c => c.unreadCount > 0);
    const q = this.query().toLowerCase().trim();
    if (q) list = list.filter(c =>
      (c.clientName ?? '').toLowerCase().includes(q) || c.phone.includes(q)
    );
    return list;
  });

  unreadTotal = computed(() =>
    this.conversations().reduce((s, c) => s + c.unreadCount, 0)
  );

  allVarsFilled = computed(() => {
    const tmpl = this.selectedTemplate();
    if (!tmpl) return false;
    const vars = this.templateVars();
    return tmpl.variables.every((_, i) => !!vars[`${i + 1}`]?.trim());
  });

  // ── Constants ──────────────────────────────────────────────────
  readonly WA_TEMPLATES         = WA_TEMPLATES;
  readonly MESSAGE_STATUS_LABEL = MESSAGE_STATUS_LABEL;

  // ── Subscriptions ──────────────────────────────────────────────
  private convSub: Subscription | null = null;
  private msgSub:  Subscription | null = null;

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit() { this.connectConversations(); }

  ngOnDestroy() {
    this.convSub?.unsubscribe();
    this.msgSub?.unsubscribe();
  }

  // ── Conversation list ──────────────────────────────────────────
  private connectConversations() {
    this.loadingConvs.set(true);
    this.convError.set('');
    let gotData = false;
    this.convSub?.unsubscribe();
    this.convSub = this.fsSvc.watchConversations(environment.tenantSlug).subscribe({
      next: convs => {
        gotData = true;
        this.conversations.set(convs);
        this.loadingConvs.set(false);
        this.realtimeActive.set(true);
      },
      complete: () => {
        // EMPTY (catchError) means Firestore unavailable — fall back to HTTP
        if (!gotData) {
          this.realtimeActive.set(false);
          this.loadConversationsHttp();
        }
      },
    });
  }

  private loadConversationsHttp() {
    this.svc.getConversations().subscribe({
      next:  convs => { this.conversations.set(convs); this.loadingConvs.set(false); },
      error: _     => { this.convError.set('No se pudieron cargar las conversaciones.'); this.loadingConvs.set(false); },
    });
  }

  retryConvs() {
    this.loadingConvs.set(true);
    this.convError.set('');
    this.connectConversations();
  }

  // ── Select / open conversation ─────────────────────────────────
  selectConversation(conv: WaConversation) {
    this.selected.set(conv);
    this.sendError.set('');
    this.messageText.set('');
    this.templatePickerOpen.set(false);
    this.selectedTemplate.set(null);
    this.templateVars.set({});
    this.connectMessages(conv.id);
    this.svc.markRead(conv.id).subscribe(() => {
      this.conversations.update(list =>
        list.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
      );
    });
  }

  private connectMessages(convId: string) {
    this.loadingMessages.set(true);
    this.msgError.set('');
    let gotData = false;
    this.msgSub?.unsubscribe();
    this.msgSub = this.fsSvc.watchMessages(environment.tenantSlug, convId).subscribe({
      next: msgs => {
        gotData = true;
        this.messages.set(msgs);
        this.loadingMessages.set(false);
        const el = this.msgContainerEl?.nativeElement;
        if (!el || el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
          this.scrollToBottom();
        }
      },
      complete: () => {
        if (!gotData) this.loadMessagesHttp(convId);
      },
    });
  }

  private loadMessagesHttp(convId: string) {
    this.svc.getMessages(convId).subscribe({
      next:  msgs => { this.messages.set(msgs); this.loadingMessages.set(false); this.scrollToBottom(); },
      error: _    => { this.msgError.set('No se pudieron cargar los mensajes.'); this.loadingMessages.set(false); },
    });
  }

  retryMessages() {
    const conv = this.selected();
    if (conv) this.connectMessages(conv.id);
  }

  // ── Send text message ──────────────────────────────────────────
  sendMessage() {
    const text = this.messageText().trim();
    const conv = this.selected();
    if (!text || !conv || this.sending()) return;
    this.sending.set(true);
    this.sendError.set('');
    this.svc.reply(conv.id, { text }).subscribe({
      next: msg => {
        if (!this.realtimeActive()) {
          // Realtime not active: optimistic add + update preview
          this.messages.update(list => [...list, msg]);
          this.conversations.update(list =>
            list.map(c => c.id === conv.id
              ? { ...c, lastMessage: text, lastMessageAt: msg.createdAt } : c
            )
          );
          this.scrollToBottom();
        }
        this.messageText.set('');
        this.sending.set(false);
      },
      error: e => { this.sendError.set(e?.error?.message ?? 'Error al enviar.'); this.sending.set(false); },
    });
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ── Template picker ────────────────────────────────────────────
  toggleTemplatePicker() {
    this.templatePickerOpen.update(v => !v);
    if (!this.templatePickerOpen()) { this.selectedTemplate.set(null); this.templateVars.set({}); }
  }

  pickTemplate(tmpl: WaTemplateDefinition) {
    this.selectedTemplate.set(tmpl);
    const vars: Record<string, string> = {};
    tmpl.variables.forEach((_, i) => vars[`${i + 1}`] = '');
    this.templateVars.set(vars);
  }

  backToTemplateList() { this.selectedTemplate.set(null); }

  setTemplateVar(key: string, value: string) {
    this.templateVars.update(v => ({ ...v, [key]: value }));
  }

  templatePreview(tmpl: WaTemplateDefinition): string {
    let body = tmpl.body;
    const vars = this.templateVars();
    tmpl.variables.forEach((_, i) => {
      const key = `${i + 1}`;
      body = body.replace(`{{${key}}}`, vars[key] || `[${tmpl.variables[i]}]`);
    });
    return body;
  }

  sendTemplate() {
    const tmpl = this.selectedTemplate();
    const conv = this.selected();
    if (!tmpl || !conv || !this.allVarsFilled()) return;
    this.sending.set(true);
    this.sendError.set('');
    this.svc.sendTemplate({ phone: conv.phone, templateName: tmpl.name, variables: this.templateVars() }).subscribe({
      next: msg => {
        if (!this.realtimeActive()) {
          this.messages.update(list => [...list, msg]);
          this.scrollToBottom();
        }
        this.templatePickerOpen.set(false);
        this.selectedTemplate.set(null);
        this.templateVars.set({});
        this.sending.set(false);
      },
      error: e => { this.sendError.set(e?.error?.message ?? 'Error al enviar template.'); this.sending.set(false); },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  initials(name: string | null, phone: string): string {
    if (name) return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return phone.slice(-2);
  }

  isRead(status: MessageStatus): boolean { return status === 'READ'; }

  trackConv(_: number, c: WaConversation) { return c.id; }
  trackMsg(_: number, m: WaMessage)       { return m.id; }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.msgContainerEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
