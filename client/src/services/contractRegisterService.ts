import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const BASE_URL = `${API_BASE}/api/company`;

export interface ContractRecord {
  id: number;
  title: string;
  type: string;
  parties: string;
  start_date: string;
  end_date: string;
  status: string;
  value: number;
  file_name?: string | null;
  file_path?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractSummary {
  totalContracts: number;
  activeContracts: number;
  expiringSoon: number;
  totalValue: number;
}

interface ContractRegisterResponse {
  records: ContractRecord[];
  summary: ContractSummary;
}

interface CompanyRecord {
  id: number;
  status?: string;
}

interface CreateContractInput {
  title: string;
  type: string;
  parties: string;
  start_date: string;
  end_date: string;
  status: string;
  value?: number;
  notes?: string;
  file?: File | null;
}

class ContractRegisterService {
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
      console.error("Failed to resolve fallback company for contracts:", error);
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

  static async getAll(companyId?: string): Promise<ContractRegisterResponse> {
    return this.requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get(
        `${BASE_URL}/${targetId}/contracts`,
        this.getHeaders(targetId),
      );
      return response.data;
    });
  }

  static async create(input: CreateContractInput, companyId?: string): Promise<ContractRecord> {
    return this.requestWithCompanyFallback(companyId, async (targetId) => {
      const payload = new FormData();
      payload.append("title", input.title);
      payload.append("type", input.type);
      payload.append("parties", input.parties);
      payload.append("start_date", input.start_date);
      payload.append("end_date", input.end_date);
      payload.append("status", input.status);
      payload.append("value", String(input.value || 0));

      if (input.notes) payload.append("notes", input.notes);
      if (input.file) payload.append("file", input.file);

      const response = await axios.post(
        `${BASE_URL}/${targetId}/contracts`,
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
}

export default ContractRegisterService;
