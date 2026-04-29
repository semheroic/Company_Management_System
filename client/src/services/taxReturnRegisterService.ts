import axios from "axios";
import {
  COMPANY_BASE_URL,
  getCompanyHeaders,
  requestWithCompanyFallback,
} from "./companyApi";

export type TaxReturnStatus = "Filed" | "Pending" | "Overdue";

export interface TaxReturnRecord {
  id: number;
  taxType: string;
  period: string;
  submissionDate: string;
  totalDeclared: number;
  status: TaxReturnStatus;
  dueDate: string;
  quarter?: string | null;
  taxYear?: string | null;
  payload?: any;
  createdAt: string;
  updatedAt: string;
}

export interface TaxReturnSummary {
  totalReturns: number;
  filedReturns: number;
  pendingReturns: number;
  overdueReturns: number;
  totalDeclared: number;
}

export interface SaveTaxReturnInput {
  taxType: string;
  period: string;
  dueDate: string;
  submissionDate?: string | null;
  totalDeclared: number;
  status?: TaxReturnStatus;
  quarter?: string | null;
  taxYear?: string | null;
  payload?: any;
}

interface TaxReturnApiRecord {
  id: number;
  tax_type: string;
  period: string;
  submission_date: string | null;
  total_declared: number | string;
  status: TaxReturnStatus;
  due_date: string;
  quarter: string | null;
  tax_year: string | null;
  payload?: any;
  payload_json?: string | null;
  created_at: string;
  updated_at: string;
}

interface TaxReturnResponse {
  records: TaxReturnApiRecord[];
  summary: TaxReturnSummary;
}

class TaxReturnRegisterService {
  static async getAll(companyId?: string): Promise<{ records: TaxReturnRecord[]; summary: TaxReturnSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<TaxReturnResponse>(
        `${COMPANY_BASE_URL}/${targetId}/tax-returns`,
        getCompanyHeaders(targetId),
      );

      return {
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
        summary: {
          ...response.data.summary,
          totalDeclared: Number(response.data.summary?.totalDeclared || 0),
        },
      };
    });
  }

  static async save(input: SaveTaxReturnInput, companyId?: string): Promise<TaxReturnRecord> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.post<TaxReturnApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/tax-returns`,
        {
          tax_type: input.taxType,
          period: input.period,
          submission_date: input.submissionDate || null,
          total_declared: input.totalDeclared,
          status: input.status,
          due_date: input.dueDate,
          quarter: input.quarter || null,
          tax_year: input.taxYear || null,
          payload: input.payload || null,
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

  static async markAsFiled(
    returnId: number,
    submissionDate: string = new Date().toISOString().split("T")[0],
    companyId?: string,
  ): Promise<TaxReturnRecord> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.patch<TaxReturnApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/tax-returns/${returnId}/filed`,
        { submission_date: submissionDate },
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

  private static mapRecord(record: TaxReturnApiRecord): TaxReturnRecord {
    return {
      id: Number(record.id),
      taxType: record.tax_type,
      period: record.period,
      submissionDate: record.submission_date || "",
      totalDeclared: Number(record.total_declared || 0),
      status: record.status,
      dueDate: record.due_date,
      quarter: record.quarter,
      taxYear: record.tax_year,
      payload: record.payload || this.parsePayload(record.payload_json),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  private static parsePayload(value?: string | null) {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}

export default TaxReturnRegisterService;
