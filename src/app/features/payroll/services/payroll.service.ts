import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  CreateEmployeeRequest, Employee, PayrollItem, PayrollPeriod, ProcessPayrollRequest,
} from '../models/payroll.model';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/payroll`;

  getEmployees(status?: string) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Employee[]>(`${this.base}/employees`, { params });
  }

  createEmployee(req: CreateEmployeeRequest) {
    return this.http.post<Employee>(`${this.base}/employees`, req);
  }

  updateEmployee(id: string, req: Partial<CreateEmployeeRequest>) {
    return this.http.patch<Employee>(`${this.base}/employees/${id}`, req);
  }

  deactivateEmployee(id: string) {
    return this.http.post<Employee>(`${this.base}/employees/${id}/deactivate`, {});
  }

  getPeriods() {
    return this.http.get<PayrollPeriod[]>(`${this.base}/periods`);
  }

  processPayroll(req: ProcessPayrollRequest) {
    return this.http.post<PayrollPeriod>(`${this.base}/process`, req);
  }

  getPayrollItems(periodId: string) {
    return this.http.get<PayrollItem[]>(`${this.base}/periods/${periodId}/items`);
  }

  getPayrollItem(periodId: string, employeeId: string) {
    return this.http.get<PayrollItem>(`${this.base}/periods/${periodId}/items/${employeeId}`);
  }

  exportPlame(periodId: string) {
    return this.http.get<PayrollItem[]>(`${this.base}/periods/${periodId}/items`);
  }
}
