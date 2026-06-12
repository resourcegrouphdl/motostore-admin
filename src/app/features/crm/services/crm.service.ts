import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  CommissionEntry, CreateCustomerRequest, CreateInteractionRequest, CreateLeadRequest,
  CreateOpportunityRequest, Customer, Interaction, Lead, Opportunity,
  SellerGoal, SellerGoalRequest, TeamRankingEntry,
} from '../models/crm.model';

@Injectable({ providedIn: 'root' })
export class CrmService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/crm`;

  // ── Customers ─────────────────────────────────────────────────────
  getCustomers()           { return this.http.get<Customer[]>(`${this.base}/customers`); }
  getCustomerById(id: string) { return this.http.get<Customer>(`${this.base}/customers/${id}`); }
  createCustomer(b: CreateCustomerRequest) {
    return this.http.post<Customer>(`${this.base}/customers`, b);
  }

  // ── Opportunities ─────────────────────────────────────────────────
  getAllOpportunities() { return this.http.get<Opportunity[]>(`${this.base}/opportunities`); }
  getMyOpportunities() { return this.http.get<Opportunity[]>(`${this.base}/opportunities/mine`); }
  getByStage(stage: string) {
    return this.http.get<Opportunity[]>(`${this.base}/opportunities/stage/${stage}`);
  }
  createOpportunity(b: CreateOpportunityRequest) {
    return this.http.post<Opportunity>(`${this.base}/opportunities`, b);
  }
  updateStage(id: string, stage: string) {
    return this.http.patch<Opportunity>(
      `${this.base}/opportunities/${id}/stage`,
      null,
      { params: new HttpParams().set('stage', stage) }
    );
  }

  // ── Leads ─────────────────────────────────────────────────────────
  getLeads(status?: string) {
    const params = status ? { params: { status } } : {};
    return this.http.get<Lead[]>(`${this.base}/leads`, params);
  }
  getLeadsByCustomer(customerId: string) {
    return this.http.get<Lead[]>(`${this.base}/leads/customer/${customerId}`);
  }
  createLead(b: CreateLeadRequest) {
    return this.http.post<Lead>(`${this.base}/leads`, b);
  }
  updateLeadStatus(id: string, status: string) {
    return this.http.patch<Lead>(`${this.base}/leads/${id}/status`, null,
      { params: { status } });
  }
  assignLeadCustomer(id: string, customerId: string) {
    return this.http.patch<Lead>(`${this.base}/leads/${id}/assign-customer`, null,
      { params: { customerId } });
  }

  // ── Team ranking ──────────────────────────────────────────────────
  getTeamRanking() {
    return this.http.get<TeamRankingEntry[]>(`${this.base}/opportunities/team-ranking`);
  }

  // ── Goals ─────────────────────────────────────────────────────────
  getMyGoal(period: string) {
    return this.http.get<SellerGoal>(`${this.base}/goals/mine`, { params: { period } });
  }
  getAllGoals(period: string) {
    return this.http.get<SellerGoal[]>(`${this.base}/goals`, { params: { period } });
  }
  saveGoal(sellerUid: string, period: string, req: SellerGoalRequest) {
    return this.http.put<SellerGoal>(`${this.base}/goals/${sellerUid}`, req, { params: { period } });
  }

  getCommissions(period: string) {
    return this.http.get<CommissionEntry[]>(`${this.base}/commissions`, { params: { period } });
  }

  // ── Interactions ──────────────────────────────────────────────────
  getInteractions(oppId: string) {
    return this.http.get<Interaction[]>(`${this.base}/opportunities/${oppId}/interactions`);
  }
  addInteraction(oppId: string, b: CreateInteractionRequest) {
    return this.http.post<Interaction>(`${this.base}/opportunities/${oppId}/interactions`, b);
  }
}
