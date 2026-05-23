import axios from "axios";
import {
  COMPANY_BASE_URL,
  getCompanyHeaders,
  requestWithCompanyFallback,
} from "./companyApi";

export interface SystemHealthOverview {
  totalTransactions: number;
  activeUsers: number;
  activeAlerts: number;
  pendingReturns: number;
}

export interface SystemHealthScores {
  ledgerBalanceScore: number;
  complianceScore: number;
  userCoverageScore: number;
  documentationCoverageScore: number;
}

export interface SystemHealthActivity {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  occurred_at: string;
  status: string;
  meta: string;
  actor: string;
}

export interface SystemHealthRecommendation {
  id: string;
  severity: "success" | "info" | "warning" | "critical";
  title: string;
  description: string;
}

export interface SystemHealthResponse {
  overview: SystemHealthOverview;
  health: SystemHealthScores;
  recentActivity: SystemHealthActivity[];
  recommendations: SystemHealthRecommendation[];
}

class SystemHealthService {
  static async getDashboard(companyId?: string): Promise<SystemHealthResponse> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<SystemHealthResponse>(
        `${COMPANY_BASE_URL}/${targetId}/system-health`,
        getCompanyHeaders(targetId),
      );

      return response.data;
    });
  }
}

export default SystemHealthService;
