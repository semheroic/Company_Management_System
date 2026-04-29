import axios from "axios";
import {
  COMPANY_BASE_URL,
  requestWithCompanyFallback,
} from "./companyApi";

export interface ComplaintRiskIssue {
  id: number;
  title: string;
  category: string;
  description: string;
  reportedDate: string;
  assignedTo: string;
  priority: string;
  status: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintRiskSummary {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
}

export interface SaveComplaintRiskInput {
  title: string;
  category: string;
  description: string;
  reportedDate?: string;
  assignedTo?: string;
  priority?: string;
  status?: string;
  deadline?: string;
}

interface ComplaintRiskApiRecord {
  id: number;
  title: string;
  category: string;
  description: string;
  reported_date: string;
  assigned_to: string | null;
  priority: string;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

interface ComplaintRiskResponse {
  records: ComplaintRiskApiRecord[];
  summary: ComplaintRiskSummary;
}

class ComplaintRiskService {
  static async getAll(companyId?: string): Promise<{ records: ComplaintRiskIssue[]; summary: ComplaintRiskSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<ComplaintRiskResponse>(
        `${COMPANY_BASE_URL}/${targetId}/complaint-risk-issues`,
        { headers: { "x-company-id": targetId } },
      );

      return {
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
        summary: response.data.summary,
      };
    });
  }

  static async create(input: SaveComplaintRiskInput, companyId?: string): Promise<ComplaintRiskIssue> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.post<ComplaintRiskApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/complaint-risk-issues`,
        {
          title: input.title,
          category: input.category,
          description: input.description,
          reported_date: input.reportedDate,
          assigned_to: input.assignedTo,
          priority: input.priority,
          status: input.status,
          deadline: input.deadline,
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

  static async update(issueId: number, input: SaveComplaintRiskInput, companyId?: string): Promise<ComplaintRiskIssue> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.put<ComplaintRiskApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/complaint-risk-issues/${issueId}`,
        {
          title: input.title,
          category: input.category,
          description: input.description,
          reported_date: input.reportedDate,
          assigned_to: input.assignedTo,
          priority: input.priority,
          status: input.status,
          deadline: input.deadline,
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

  static async remove(issueId: number, companyId?: string): Promise<void> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      await axios.delete(`${COMPANY_BASE_URL}/${targetId}/complaint-risk-issues/${issueId}`, {
        headers: { "x-company-id": targetId },
      });
    });
  }

  private static mapRecord(record: ComplaintRiskApiRecord): ComplaintRiskIssue {
    return {
      id: Number(record.id),
      title: record.title,
      category: record.category,
      description: record.description,
      reportedDate: record.reported_date,
      assignedTo: record.assigned_to || "",
      priority: record.priority,
      status: record.status,
      deadline: record.deadline || "",
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export default ComplaintRiskService;
