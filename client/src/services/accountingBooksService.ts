import axios from "axios";
import { API_BASE } from "./companyApi";

const BASE_URL = `${API_BASE}/api/company`;

export interface AccountingBookEntry {
  id: number;
  journal_entry_id: number;
  date: string;
  reference: string;
  account_id: number;
  account_code: string;
  account_name: string;
  description: string;
  source_type: string;
  debit: number;
  credit: number;
  document_file_name?: string | null;
  document_file_path?: string | null;
  created_at: string;
}

export interface AccountingBookSummary {
  journalCount: number;
  lineCount: number;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
}

export interface AccountingAccount {
  id: number;
  code: string;
  name: string;
  category: string;
  is_active: number;
}

export interface TrialBalanceEntry {
  name: string;
  code: string;
  category: string;
  total_debit: number | string;
  total_credit: number | string;
  net_balance: number | string;
}

interface AccountingBooksResponse {
  entries: AccountingBookEntry[];
  summary: AccountingBookSummary;
}

interface ManualEntryInput {
  entryType: string;
  date: string;
  account_id: number;
  offset_account_id: number;
  debit?: number;
  credit?: number;
  description: string;
  reference_no?: string;
  receipt?: File | null;
}

interface SyncedTransactionInput {
  date: string;
  description: string;
  reference: string;
  source_type: string;
  source_id?: string;
  entries: Array<{
    account_code: string;
    account_name: string;
    debit?: number;
    credit?: number;
  }>;
}

interface CompanyRecord {
  id: number;
  status?: string;
}

class AccountingBooksService {
  static getCurrentCompanyId(): string | null {
    return localStorage.getItem("selectedCompanyId");
  }

  private static getHeaders(companyId: string) {
    return {
      headers: {
        "x-company-id": companyId,
      },
    };
  }

  private static async findFallbackCompanyId(): Promise<string | null> {
    try {
      const response = await axios.get(`${API_BASE}/api/companies`);
      const companies: CompanyRecord[] = Array.isArray(response.data) ? response.data : [];
      const fallback = companies.find((company) => company.status === "active") || companies[0];

      if (!fallback?.id) {
        return null;
      }

      const resolved = String(fallback.id);
      localStorage.setItem("selectedCompanyId", resolved);
      return resolved;
    } catch (error) {
      console.error("Failed to resolve fallback company:", error);
      return null;
    }
  }

  private static async resolveCompanyId(preferredCompanyId?: string): Promise<string> {
    if (preferredCompanyId) {
      return preferredCompanyId;
    }

    const currentId = this.getCurrentCompanyId();
    if (currentId) {
      return currentId;
    }

    const fallbackId = await this.findFallbackCompanyId();
    if (fallbackId) {
      return fallbackId;
    }

    throw new Error("No company is selected. Select or create a company first.");
  }

  private static async requestWithCompanyFallback<T>(
    preferredCompanyId: string | undefined,
    request: (companyId: string) => Promise<T>,
  ): Promise<T> {
    const initialCompanyId = await this.resolveCompanyId(preferredCompanyId);

    try {
      return await request(initialCompanyId);
    } catch (error: any) {
      const shouldRetryWithFallback =
        error?.response?.status === 404 &&
        (!preferredCompanyId || preferredCompanyId === initialCompanyId);

      if (!shouldRetryWithFallback) {
        throw error;
      }

      const fallbackId = await this.findFallbackCompanyId();
      if (!fallbackId || fallbackId === initialCompanyId) {
        throw error;
      }

      return request(fallbackId);
    }
  }

  static async getAccountingBooks(companyId?: string): Promise<AccountingBooksResponse> {
    return this.requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get(
        `${BASE_URL}/${targetId}/accounting-books`,
        this.getHeaders(targetId),
      );
      return response.data;
    });
  }

  static async getAccounts(companyId?: string): Promise<AccountingAccount[]> {
    return this.requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get(
        `${BASE_URL}/${targetId}/accounting-books/accounts`,
        this.getHeaders(targetId),
      );
      return response.data || [];
    });
  }

  static async getTrialBalance(companyId?: string): Promise<TrialBalanceEntry[]> {
    return this.requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get(
        `${BASE_URL}/${targetId}/ledger/trial-balance`,
        this.getHeaders(targetId),
      );
      return response.data || [];
    });
  }

  static async createManualEntry(input: ManualEntryInput, companyId?: string) {
    return this.requestWithCompanyFallback(companyId, async (targetId) => {
      const payload = new FormData();

      payload.append("entryType", input.entryType);
      payload.append("date", input.date);
      payload.append("account_id", String(input.account_id));
      payload.append("offset_account_id", String(input.offset_account_id));
      payload.append("description", input.description);

      if (typeof input.debit === "number" && input.debit > 0) {
        payload.append("debit", String(input.debit));
      }

      if (typeof input.credit === "number" && input.credit > 0) {
        payload.append("credit", String(input.credit));
      }

      if (input.reference_no) {
        payload.append("reference_no", input.reference_no);
      }

      if (input.receipt) {
        payload.append("receipt", input.receipt);
      }

      const response = await axios.post(
        `${BASE_URL}/${targetId}/accounting-books/manual-entry`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-company-id": targetId,
          },
        },
      );

      return response.data;
    });
  }

  static async syncGeneratedTransaction(input: SyncedTransactionInput, companyId?: string) {
    return this.requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.post(
        `${BASE_URL}/${targetId}/accounting-books/transactions`,
        input,
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": targetId,
          },
        },
      );
      return response.data;
    });
  }
}

export default AccountingBooksService;
