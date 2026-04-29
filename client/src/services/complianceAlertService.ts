import axios from "axios";
import {
  COMPANY_BASE_URL,
  requestWithCompanyFallback,
} from "./companyApi";

export interface ComplianceAlertRecord {
  id: number;
  title: string;
  description: string;
  type: "tax" | "hr" | "compliance" | "financial" | "license" | "custom";
  severity: "high" | "medium" | "low";
  status: "active" | "acknowledged" | "resolved" | "snoozed";
  alertDate: string;
  dueDate: string;
  forRole: string[];
  isRead: boolean;
  createdBy?: string | null;
  source: "auto" | "manual";
  actionRequired?: string | null;
  snoozedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAlertSummary {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  highPriority: number;
}

export interface SaveComplianceAlertInput {
  title: string;
  description: string;
  type: ComplianceAlertRecord["type"];
  severity: ComplianceAlertRecord["severity"];
  dueDate: string;
  alertDate?: string;
  forRole: string[];
  isRead?: boolean;
  createdBy?: string;
  source?: ComplianceAlertRecord["source"];
  actionRequired?: string;
}

interface ComplianceAlertApiRecord {
  id: number;
  title: string;
  description: string;
  type: ComplianceAlertRecord["type"];
  severity: ComplianceAlertRecord["severity"];
  status: ComplianceAlertRecord["status"];
  alert_date: string;
  due_date: string;
  for_roles: string[];
  is_read: boolean;
  created_by: string | null;
  source: ComplianceAlertRecord["source"];
  action_required: string | null;
  snoozed_until: string | null;
  created_at: string;
  updated_at: string;
}

interface ComplianceAlertResponse {
  records: ComplianceAlertApiRecord[];
  summary: ComplianceAlertSummary;
}

class ComplianceAlertService {
  static async getAll(companyId?: string): Promise<{ records: ComplianceAlertRecord[]; summary: ComplianceAlertSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<ComplianceAlertResponse>(
        `${COMPANY_BASE_URL}/${targetId}/compliance-alerts`,
        { headers: { "x-company-id": targetId } },
      );

      return {
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
        summary: response.data.summary,
      };
    });
  }

  static async create(input: SaveComplianceAlertInput, companyId?: string): Promise<ComplianceAlertRecord> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.post<ComplianceAlertApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/compliance-alerts`,
        {
          title: input.title,
          description: input.description,
          type: input.type,
          severity: input.severity,
          due_date: input.dueDate,
          alert_date: input.alertDate,
          for_roles: input.forRole,
          is_read: input.isRead,
          created_by: input.createdBy,
          source: input.source || "manual",
          action_required: input.actionRequired,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": targetId,
          },
        },
      );

      return this.mapRecord(response.data);
    });
  }

  static async updateStatus(
    alertId: number,
    status: ComplianceAlertRecord["status"],
    options?: { isRead?: boolean; snoozedUntil?: string | null },
    companyId?: string,
  ): Promise<ComplianceAlertRecord> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.patch<ComplianceAlertApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/compliance-alerts/${alertId}/status`,
        {
          status,
          is_read: options?.isRead,
          snoozed_until: options?.snoozedUntil || null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": targetId,
          },
        },
      );

      return this.mapRecord(response.data);
    });
  }

  static getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private static mapRecord(record: ComplianceAlertApiRecord): ComplianceAlertRecord {
    return {
      id: Number(record.id),
      title: record.title,
      description: record.description,
      type: record.type,
      severity: record.severity,
      status: record.status,
      alertDate: record.alert_date,
      dueDate: record.due_date,
      forRole: Array.isArray(record.for_roles) ? record.for_roles : [],
      isRead: Boolean(record.is_read),
      createdBy: record.created_by,
      source: record.source,
      actionRequired: record.action_required,
      snoozedUntil: record.snoozed_until,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export default ComplianceAlertService;
