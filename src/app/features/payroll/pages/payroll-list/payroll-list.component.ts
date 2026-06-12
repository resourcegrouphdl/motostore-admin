import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../services/payroll.service';
import {
  AfpName, AFP_NAMES, BANK_NAMES, CreateEmployeeRequest, DEPARTMENTS,
  Employee, EmployeeFormState, EmployeeStatus, PayrollItem,
  PayrollPeriod, PAYROLL_STATUS_LABEL, PENSION_TYPE_LABEL,
  MONTH_LABEL, SUELDO_MINIMO, emptyEmployeeForm,
} from '../../models/payroll.model';

type PayrollTab = 'employees' | 'payroll' | 'payslips' | 'plame';

@Component({
  selector:    'app-payroll-list',
  standalone:  true,
  imports:     [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './payroll-list.component.html',
  styleUrl:    './payroll-list.component.scss',
})
export class PayrollListComponent implements OnInit {
  private svc = inject(PayrollService);

  // ── Navigation ─────────────────────────────────────────────────
  activeTab = signal<PayrollTab>('employees');

  // ── Periods ────────────────────────────────────────────────────
  periods          = signal<PayrollPeriod[]>([]);
  loadingPeriods   = signal(false);
  periodsError     = signal('');
  selectedPeriodId = signal('');

  // ── Employee list ──────────────────────────────────────────────
  employees        = signal<Employee[]>([]);
  loadingEmployees = signal(true);
  employeesError   = signal('');
  employeeQuery    = signal('');
  statusFilter     = signal<'ALL' | EmployeeStatus>('ACTIVE');

  // ── Employee form (slide-in) ───────────────────────────────────
  showForm       = signal(false);
  editingId      = signal<string | null>(null);
  form           = signal<EmployeeFormState>(emptyEmployeeForm());
  formErrors     = signal<Partial<Record<keyof EmployeeFormState, string>>>({});
  saving         = signal(false);
  saveError      = signal('');
  saveSuccess    = signal(false);
  deactivateConfirmId = signal<string | null>(null);
  deactivating   = signal(false);

  // ── Payroll (monthly processing) ──────────────────────────────
  payrollItems      = signal<PayrollItem[]>([]);
  loadingPayroll    = signal(false);
  payrollError      = signal('');
  processing        = signal(false);
  processError      = signal('');
  processSuccess    = signal(false);
  processYear       = signal(new Date().getFullYear());
  processMonth      = signal(new Date().getMonth() + 1);

  // ── Payslips ──────────────────────────────────────────────────
  selectedPayslipEmpId = signal<string | null>(null);
  payslipItem          = signal<PayrollItem | null>(null);
  loadingPayslip       = signal(false);
  payslipError         = signal('');

  // ── PLAME export ───────────────────────────────────────────────
  exportingPlame = signal(false);
  plameError     = signal('');

  // ── Computed ───────────────────────────────────────────────────
  filteredEmployees = computed(() => {
    let list = this.employees();
    const sf = this.statusFilter();
    if (sf !== 'ALL') list = list.filter(e => e.status === sf);
    const q = this.employeeQuery().toLowerCase().trim();
    if (q) list = list.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      e.dni.includes(q) ||
      e.position.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
    return list;
  });

  activeEmployees = computed(() => this.employees().filter(e => e.status === 'ACTIVE'));
  activeCount     = computed(() => this.activeEmployees().length);

  selectedPeriod = computed(() =>
    this.periods().find(p => p.id === this.selectedPeriodId()) ?? null
  );

  payrollTotals = computed(() => ({
    bruto:   this.payrollItems().reduce((s, i) => s + i.grossSalary, 0),
    desc:    this.payrollItems().reduce((s, i) => s + i.totalDeductions, 0),
    neto:    this.payrollItems().reduce((s, i) => s + i.netSalary, 0),
    essalud: this.payrollItems().reduce((s, i) => s + i.employerEssalud, 0),
  }));

  selectedPayslipEmployee = computed(() =>
    this.employees().find(e => e.id === this.selectedPayslipEmpId()) ?? null
  );

  isFormValid = computed(() => {
    const f = this.form();
    return (
      f.firstName.trim().length > 0 &&
      f.lastName.trim().length > 0 &&
      /^\d{8}$/.test(f.dni) &&
      f.position.trim().length > 0 &&
      (f.baseSalary ?? 0) >= SUELDO_MINIMO &&
      f.startDate.length > 0 &&
      (f.pensionType === 'ONP' || f.afpName !== '')
    );
  });

  yearOptions = computed(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  });

  monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: MONTH_LABEL[i + 1] }));

  // ── Constants ──────────────────────────────────────────────────
  readonly PENSION_TYPE_LABEL  = PENSION_TYPE_LABEL;
  readonly PAYROLL_STATUS_LABEL = PAYROLL_STATUS_LABEL;
  readonly AFP_NAMES           = AFP_NAMES;
  readonly BANK_NAMES          = BANK_NAMES;
  readonly DEPARTMENTS         = DEPARTMENTS;
  readonly MONTH_LABEL         = MONTH_LABEL;
  readonly SUELDO_MINIMO       = SUELDO_MINIMO;

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit() {
    this.loadEmployees();
    this.loadPeriods();
  }

  // ── Tab navigation ─────────────────────────────────────────────
  setTab(tab: PayrollTab) {
    this.activeTab.set(tab);
    this.showForm.set(false);
    if (tab === 'payroll' || tab === 'payslips' || tab === 'plame') {
      if (this.selectedPeriodId() && this.payrollItems().length === 0 && !this.payrollError()) {
        this.loadPayrollItems();
      }
    }
  }

  // ── Employees ──────────────────────────────────────────────────
  private loadEmployees() {
    this.loadingEmployees.set(true);
    this.employeesError.set('');
    this.svc.getEmployees().subscribe({
      next:  emps => { this.employees.set(emps); this.loadingEmployees.set(false); },
      error: _    => { this.employeesError.set('No se pudo cargar la lista de empleados.'); this.loadingEmployees.set(false); },
    });
  }

  retryEmployees() { this.loadEmployees(); }

  openNewForm() {
    this.editingId.set(null);
    this.form.set(emptyEmployeeForm());
    this.formErrors.set({});
    this.saveError.set('');
    this.saveSuccess.set(false);
    this.showForm.set(true);
  }

  openEditForm(emp: Employee) {
    this.editingId.set(emp.id);
    this.form.set({
      firstName:   emp.firstName,
      lastName:    emp.lastName,
      dni:         emp.dni,
      position:    emp.position,
      department:  emp.department,
      baseSalary:  emp.baseSalary,
      pensionType: emp.pensionType,
      afpName:     emp.afpName ?? '',
      startDate:   emp.startDate,
      bankAccount: emp.bankAccount ?? '',
      bankName:    emp.bankName ?? 'BCP',
    });
    this.formErrors.set({});
    this.saveError.set('');
    this.saveSuccess.set(false);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formErrors.set({});
    this.saveError.set('');
  }

  setField<K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]) {
    this.form.update(f => ({ ...f, [key]: value }));
    if (this.formErrors()[key]) this.formErrors.update(e => ({ ...e, [key]: undefined }));
  }

  saveEmployee() {
    if (!this.isFormValid() || this.saving()) return;
    const f = this.form();
    const req: CreateEmployeeRequest = {
      firstName:   f.firstName.trim(),
      lastName:    f.lastName.trim(),
      dni:         f.dni.trim(),
      position:    f.position.trim(),
      department:  f.department,
      baseSalary:  f.baseSalary!,
      pensionType: f.pensionType,
      afpName:     f.pensionType === 'AFP' ? (f.afpName as AfpName) : null,
      startDate:   f.startDate,
      bankAccount: f.bankAccount.trim(),
      bankName:    f.bankName,
    };
    this.saving.set(true);
    this.saveError.set('');

    const id = this.editingId();
    const call = id ? this.svc.updateEmployee(id, req) : this.svc.createEmployee(req);

    call.subscribe({
      next: saved => {
        if (id) {
          this.employees.update(list => list.map(e => e.id === id ? saved : e));
        } else {
          this.employees.update(list => [saved, ...list]);
        }
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => { this.saveSuccess.set(false); this.closeForm(); }, 1800);
      },
      error: e => {
        this.saveError.set(e?.error?.message ?? 'Error al guardar el empleado.');
        this.saving.set(false);
      },
    });
  }

  requestDeactivate(empId: string) { this.deactivateConfirmId.set(empId); }
  cancelDeactivate()               { this.deactivateConfirmId.set(null); }

  confirmDeactivate() {
    const id = this.deactivateConfirmId();
    if (!id) return;
    this.deactivating.set(true);
    this.svc.deactivateEmployee(id).subscribe({
      next: updated => {
        this.employees.update(list => list.map(e => e.id === id ? updated : e));
        this.deactivateConfirmId.set(null);
        this.deactivating.set(false);
      },
      error: _ => { this.deactivating.set(false); },
    });
  }

  // ── Periods ────────────────────────────────────────────────────
  private loadPeriods() {
    this.loadingPeriods.set(true);
    this.svc.getPeriods().subscribe({
      next: periods => {
        this.periods.set(periods);
        this.loadingPeriods.set(false);
        if (periods.length > 0) {
          this.selectedPeriodId.set(periods[0].id);
        }
      },
      error: _ => { this.periodsError.set('No se pudieron cargar los períodos.'); this.loadingPeriods.set(false); },
    });
  }

  changePeriod(id: string) {
    this.selectedPeriodId.set(id);
    this.payrollItems.set([]);
    this.payrollError.set('');
    this.payslipItem.set(null);
    this.selectedPayslipEmpId.set(null);
    if (this.activeTab() !== 'employees') this.loadPayrollItems();
  }

  // ── Payroll processing ─────────────────────────────────────────
  private loadPayrollItems() {
    const pid = this.selectedPeriodId();
    if (!pid) return;
    this.loadingPayroll.set(true);
    this.payrollError.set('');
    this.svc.getPayrollItems(pid).subscribe({
      next:  items => { this.payrollItems.set(items); this.loadingPayroll.set(false); },
      error: _     => { this.payrollError.set('No se pudo cargar la planilla.'); this.loadingPayroll.set(false); },
    });
  }

  retryPayroll() { this.payrollItems.set([]); this.loadPayrollItems(); }

  processPayroll() {
    if (this.processing()) return;
    this.processing.set(true);
    this.processError.set('');
    this.processSuccess.set(false);
    this.svc.processPayroll({ year: this.processYear(), month: this.processMonth() }).subscribe({
      next: period => {
        const exists = this.periods().some(p => p.id === period.id);
        if (exists) {
          this.periods.update(list => list.map(p => p.id === period.id ? period : p));
        } else {
          this.periods.update(list => [period, ...list]);
        }
        this.selectedPeriodId.set(period.id);
        this.processing.set(false);
        this.processSuccess.set(true);
        this.loadPayrollItems();
        setTimeout(() => this.processSuccess.set(false), 3000);
      },
      error: e => {
        this.processError.set(e?.error?.message ?? 'Error al procesar la planilla.');
        this.processing.set(false);
      },
    });
  }

  // ── Payslips ──────────────────────────────────────────────────
  selectPayslipEmployee(empId: string) {
    this.selectedPayslipEmpId.set(empId);
    const pid = this.selectedPeriodId();
    if (!pid) return;
    this.loadingPayslip.set(true);
    this.payslipError.set('');
    this.payslipItem.set(null);
    this.svc.getPayrollItem(pid, empId).subscribe({
      next:  item => { this.payslipItem.set(item); this.loadingPayslip.set(false); },
      error: _    => { this.payslipError.set('No se encontró la boleta para este empleado.'); this.loadingPayslip.set(false); },
    });
  }

  printPayslip() { window.print(); }

  // ── PLAME export ───────────────────────────────────────────────
  exportPlame() {
    const pid = this.selectedPeriodId();
    if (!pid || this.exportingPlame()) return;
    this.exportingPlame.set(true);
    this.plameError.set('');
    this.svc.exportPlame(pid).subscribe({
      next: items => {
        const period = this.selectedPeriod();
        if (!period) { this.exportingPlame.set(false); return; }
        const tag = `${period.year}${String(period.month).padStart(2, '0')}`;
        const header = '|Periodo|DNI|ApellidoPaterno|ApellidoMaterno|Nombres|Días|Remuneración|TipoPensión|AFP|AportePensión|RetenciónRenta|Essalud|';
        const lines = items.map(i => {
          const [first = '', ...rest] = i.employeeName.split(' ');
          const apellidos = rest.join(' ');
          return `|${tag}|${i.dni}|${apellidos}||${first}|${i.workedDays}|${i.grossSalary.toFixed(2)}|${i.pensionType}|${i.afpName ?? 'ONP'}|${i.pensionContribution.toFixed(2)}|${i.incomeTaxRetention.toFixed(2)}|${i.employerEssalud.toFixed(2)}|`;
        });
        const content = [header, ...lines].join('\r\n');
        const blob = new Blob(['﻿' + content], { type: 'text/plain;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `PLAME_${tag}.txt`; a.click();
        URL.revokeObjectURL(url);
        this.exportingPlame.set(false);
      },
      error: _ => {
        this.plameError.set('Error al generar el archivo PLAME.');
        this.exportingPlame.set(false);
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  periodLabel(p: PayrollPeriod): string {
    return `${MONTH_LABEL[p.month]} ${p.year}`;
  }

  afpLabel(name: string | null): string {
    if (!name) return 'ONP';
    return AFP_NAMES.find(a => a.value === name)?.label ?? name;
  }

  isDniValid(dni: string): boolean {
    return /^\d{8}$/.test(dni);
  }

  trackById(_: number, item: { id: string }) { return item.id; }
  trackByIdx(i: number) { return i; }
}
