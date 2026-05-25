import axios from "axios";
import { API_BASE } from "./companyApi";

const BASE_URL = `${API_BASE}/api/company`;

export interface InvoiceReceiptRecord {
  id: number;
  transaction_id: string;
  type: "invoice" | "receipt";
  number: string;
  party_name: string;
  tin?: string;
  description: string;
  amount: number;
  vat: number;
  total: number;
  attachment_url?: string;
  date: string;
  due_date?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "unpaid" | "partially_paid" | "cancelled";
  created_at: string;
  payment_method?: string;
  phone_number?: string;
  momo_reference?: string;
  tax_category?: string;
}

export interface InvoiceReceiptSummary {
  totalInvoices: number;
  totalReceipts: number;
  totalSales: number;
  totalPurchases: number;
  outstandingInvoices: number;
  pendingReceipts: number;
}

interface InvoiceRegisterResponse {
  records: InvoiceReceiptRecord[];
  summary: InvoiceReceiptSummary;
}

interface SyncTransactionInput {
  transaction_id: string;
  type: "invoice" | "receipt" | "sale" | "purchase";
  number?: string;
  party_name: string;
  tin?: string;
  description: string;
  amount: number;
  vat?: number;
  total?: number;
  attachment_url?: string;
  date: string;
  due_date?: string;
  status?: string;
  payment_method?: string;
  phone_number?: string;
  momo_reference?: string;
  tax_category?: string;
}

interface CompanyRecord {
  id: number;
  status?: string;
}

class InvoiceRegisterService {
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

      if (!fallback?.id) return null;

      const resolved = String(fallback.id);
      localStorage.setItem("selectedCompanyId", resolved);
      return resolved;
    } catch (error) {
      console.error("Failed to resolve fallback company for invoices:", error);
      return null;
    }
  }

  private static async resolveCompanyId(preferredCompanyId?: string): Promise<string> {
    if (preferredCompanyId) return preferredCompanyId;

    const currentId = this.getCurrentCompanyId();
    if (currentId) return currentId;

    const fallbackId = await this.findFallbackCompanyId();
    if (fallbackId) return fallbackId;

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

      if (!shouldRetryWithFallback) throw error;

      const fallbackId = await this.findFallbackCompanyId();
      if (!fallbackId || fallbackId === initialCompanyId) throw error;

      return request(fallbackId);
    }
  }

  static async getAll(companyId?: string): Promise<InvoiceRegisterResponse> {
    return this.requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get(
        `${BASE_URL}/${targetId}/invoices-receipts`,
        this.getHeaders(targetId),
      );
      return response.data;
    });
  }

  static async syncTransaction(input: SyncTransactionInput, companyId?: string) {
    return this.requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.post(
        `${BASE_URL}/${targetId}/invoices-receipts/sync-transaction`,
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

export default InvoiceRegisterService;
