import axios from "axios";
import {
  COMPANY_BASE_URL,
  requestWithCompanyFallback,
} from "./companyApi";

export interface InternalAuditReport {
  id: number;
  title: string;
  auditType: string;
  auditor: string;
  auditedPeriod: string;
  reportDate: string;
  status: string;
  findings: number;
  description: string;
  recommendations: string;
  attachmentFileName?: string | null;
  attachmentFilePath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InternalAuditSummary {
  totalReports: number;
  completed: number;
  inProgress: number;
  totalFindings: number;
}

export interface SaveInternalAuditInput {
  title: string;
  auditType: string;
  auditor: string;
  auditedPeriod: string;
  reportDate?: string;
  status: string;
  findings: number;
  description?: string;
  recommendations?: string;
  attachment?: File | null;
}

interface InternalAuditApiRecord {
  id: number;
  title: string;
  audit_type: string;
  auditor: string;
  audited_period: string;
  report_date: string | null;
  status: string;
  findings_count: number | string;
  description: string | null;
  recommendations: string | null;
  attachment_file_name: string | null;
  attachment_file_path: string | null;
  created_at: string;
  updated_at: string;
}

interface InternalAuditResponse {
  records: InternalAuditApiRecord[];
  summary: InternalAuditSummary;
}

class InternalAuditReportService {
  static async getAll(companyId?: string): Promise<{ records: InternalAuditReport[]; summary: InternalAuditSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<InternalAuditResponse>(
        `${COMPANY_BASE_URL}/${targetId}/internal-audit-reports`,
        { headers: { "x-company-id": targetId } },
      );

      return {
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
        summary: {
          totalReports: Number(response.data.summary?.totalReports || 0),
          completed: Number(response.data.summary?.completed || 0),
          inProgress: Number(response.data.summary?.inProgress || 0),
          totalFindings: Number(response.data.summary?.totalFindings || 0),
        },
      };
    });
  }

  static async create(input: SaveInternalAuditInput, companyId?: string): Promise<InternalAuditReport> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const formData = this.buildFormData(input);
      const response = await axios.post<InternalAuditApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/internal-audit-reports`,
        formData,
        { headers: { "x-company-id": targetId } },
      );

      return this.mapRecord(response.data);
    });
  }

  static async update(reportId: number, input: SaveInternalAuditInput, companyId?: string): Promise<InternalAuditReport> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const formData = this.buildFormData(input);
      const response = await axios.put<InternalAuditApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/internal-audit-reports/${reportId}`,
        formData,
        { headers: { "x-company-id": targetId } },
      );

      return this.mapRecord(response.data);
    });
  }

  static async remove(reportId: number, companyId?: string): Promise<void> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      await axios.delete(`${COMPANY_BASE_URL}/${targetId}/internal-audit-reports/${reportId}`, {
        headers: { "x-company-id": targetId },
      });
    });
  }

  private static buildFormData(input: SaveInternalAuditInput) {
    const formData = new FormData();
    formData.append("title", input.title);
    formData.append("audit_type", input.auditType);
    formData.append("auditor", input.auditor);
    formData.append("audited_period", input.auditedPeriod);
    formData.append("status", input.status);
    formData.append("findings_count", String(input.findings || 0));
    if (input.reportDate) formData.append("report_date", input.reportDate);
    if (input.description) formData.append("description", input.description);
    if (input.recommendations) formData.append("recommendations", input.recommendations);
    if (input.attachment) formData.append("attachment", input.attachment);
    return formData;
  }

  private static mapRecord(record: InternalAuditApiRecord): InternalAuditReport {
    return {
      id: Number(record.id),
      title: record.title,
      auditType: record.audit_type,
      auditor: record.auditor,
      auditedPeriod: record.audited_period,
      reportDate: record.report_date || "",
      status: record.status,
      findings: Number(record.findings_count || 0),
      description: record.description || "",
      recommendations: record.recommendations || "",
      attachmentFileName: record.attachment_file_name,
      attachmentFilePath: record.attachment_file_path,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export default InternalAuditReportService;
