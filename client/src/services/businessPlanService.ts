import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`;

export interface BusinessPlan {
  id: number; // MySQL auto-increment IDs are numbers
  company_id: number;
  title: string;
  year: number;
  description?: string;
  strategic_goals?: string;
  mission_statement?: string;
  vision_statement?: string;
  swot_analysis?: string;
  financial_projections?: string;
  market_analysis?: string;
  competitive_analysis?: string;
  file_path?: string;
  file_name?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
}

class BusinessPlanService {
  static getCurrentCompanyId(): number | null {
    const rawId = localStorage.getItem('selectedCompanyId');
    if (!rawId) return null;

    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * Helper to set headers for the validateCompany middleware
   */
  private static getHeaders(companyId: number) {
    return {
      headers: { 
        'x-company-id': String(companyId),
        'Content-Type': 'application/json'
      }
    };
  }

  // GET all plans for a company
  static async getAllBusinessPlans(companyId: number): Promise<BusinessPlan[]> {
    const response = await axios.get(
      `${API_URL}/company/${companyId}/business-plans`,
      this.getHeaders(companyId)
    );
    return response.data;
  }

  // GET the single active plan
  static async getActiveBusinessPlan(companyId: number): Promise<BusinessPlan | null> {
    const response = await axios.get(
      `${API_URL}/company/${companyId}/business-plans/active`,
      this.getHeaders(companyId)
    );
    return response.data;
  }

  // POST create a new plan
  static async createBusinessPlan(
    companyId: number, 
    data: Omit<BusinessPlan, 'id' | 'created_at' | 'updated_at' | 'version' | 'company_id'>
  ): Promise<BusinessPlan> {
    const response = await axios.post(
      `${API_URL}/company/${companyId}/business-plans`,
      data,
      this.getHeaders(companyId)
    );
    return response.data;
  }

  // PUT update a plan (Using :planId to avoid clash with companyId)
  static async updateBusinessPlan(
    companyId: number, 
    planId: number, 
    updates: Partial<BusinessPlan>
  ): Promise<BusinessPlan> {
    const response = await axios.put(
      `${API_URL}/company/${companyId}/business-plans/${planId}`,
      updates,
      this.getHeaders(companyId)
    );
    return response.data;
  }

  // DELETE a plan
  static async deleteBusinessPlan(companyId: number, planId: number): Promise<boolean> {
    await axios.delete(
      `${API_URL}/company/${companyId}/business-plans/${planId}`,
      this.getHeaders(companyId)
    );
    return true;
  }

  // PATCH archive a plan
  static async archiveBusinessPlan(companyId: number, planId: number): Promise<boolean> {
    await axios.patch(
      `${API_URL}/company/${companyId}/business-plans/${planId}/archive`,
      {},
      this.getHeaders(companyId)
    );
    return true;
  }

  // PATCH set active (This triggers the backend transaction to archive others)
  static async setActiveBusinessPlan(companyId: number, planId: number): Promise<boolean> {
    await axios.patch(
      `${API_URL}/company/${companyId}/business-plans/${planId}/active`,
      {},
      this.getHeaders(companyId)
    );
    return true;
  }

  /**
   * Summarizes plan counts per year from live data
   */
  static async getYearsSummary(companyId: number): Promise<Array<{ year: number; planCount: number; hasActive: boolean }>> {
    const plans = await this.getAllBusinessPlans(companyId);
    const yearMap = new Map<number, { count: number; hasActive: boolean }>();
    
    plans.forEach(plan => {
      const existing = yearMap.get(plan.year) || { count: 0, hasActive: false };
      yearMap.set(plan.year, {
        count: existing.count + 1,
        hasActive: existing.hasActive || plan.status === 'active'
      });
    });

    return Array.from(yearMap.entries())
      .map(([year, data]) => ({
        year,
        planCount: data.count,
        hasActive: data.hasActive
      }))
      .sort((a, b) => b.year - a.year);
  }
}

export default BusinessPlanService;
