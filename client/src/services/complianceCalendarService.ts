import axios from "axios";
import {
  COMPANY_BASE_URL,
  requestWithCompanyFallback,
} from "./companyApi";

export interface ComplianceDeadline {
  id: number;
  task: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  department: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  reminderDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceCalendarSummary {
  total: number;
  highPriority: number;
  mediumPriority: number;
  completed: number;
  overdue: number;
}

export interface SaveComplianceDeadlineInput {
  task: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  department: string;
  description?: string;
  status?: "pending" | "in-progress" | "completed" | "overdue";
  reminderDays?: number;
}

interface ComplianceDeadlineApiRecord {
  id: number;
  task: string;
  due_date: string;
  priority: "high" | "medium" | "low";
  department: string;
  description: string | null;
  status: "pending" | "in-progress" | "completed" | "overdue";
  reminder_days: number | string;
  created_at: string;
  updated_at: string;
}

interface ComplianceDeadlineResponse {
  records: ComplianceDeadlineApiRecord[];
  summary: ComplianceCalendarSummary;
}

class ComplianceCalendarService {
  static async getAll(companyId?: string): Promise<{ records: ComplianceDeadline[]; summary: ComplianceCalendarSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<ComplianceDeadlineResponse>(
        `${COMPANY_BASE_URL}/${targetId}/compliance-calendar`,
        { headers: { "x-company-id": targetId } },
      );

      return {
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
        summary: response.data.summary,
      };
    });
  }

  static async create(input: SaveComplianceDeadlineInput, companyId?: string): Promise<ComplianceDeadline> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.post<ComplianceDeadlineApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/compliance-calendar`,
        {
          task: input.task,
          due_date: input.dueDate,
          priority: input.priority,
          department: input.department,
          description: input.description,
          status: input.status,
          reminder_days: input.reminderDays,
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

  static async update(deadlineId: number, input: SaveComplianceDeadlineInput, companyId?: string): Promise<ComplianceDeadline> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.put<ComplianceDeadlineApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/compliance-calendar/${deadlineId}`,
        {
          task: input.task,
          due_date: input.dueDate,
          priority: input.priority,
          department: input.department,
          description: input.description,
          status: input.status,
          reminder_days: input.reminderDays,
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

  static async remove(deadlineId: number, companyId?: string): Promise<void> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      await axios.delete(`${COMPANY_BASE_URL}/${targetId}/compliance-calendar/${deadlineId}`, {
        headers: { "x-company-id": targetId },
      });
    });
  }

  private static mapRecord(record: ComplianceDeadlineApiRecord): ComplianceDeadline {
    return {
      id: Number(record.id),
      task: record.task,
      dueDate: record.due_date,
      priority: record.priority,
      department: record.department,
      description: record.description || "",
      status: record.status,
      reminderDays: Number(record.reminder_days || 0),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export default ComplianceCalendarService;
