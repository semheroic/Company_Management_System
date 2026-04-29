import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
export const COMPANY_BASE_URL = `${API_BASE}/api/company`;

interface CompanyRecord {
  id: number;
  status?: string;
}

export const getCurrentCompanyId = (): string | null => localStorage.getItem("selectedCompanyId");

export const getCompanyHeaders = (companyId: string) => ({
  headers: {
    "x-company-id": companyId,
  },
});

const findFallbackCompanyId = async (): Promise<string | null> => {
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
};

export const resolveCompanyId = async (preferredCompanyId?: string): Promise<string> => {
  if (preferredCompanyId) {
    return preferredCompanyId;
  }

  const currentId = getCurrentCompanyId();
  if (currentId) {
    return currentId;
  }

  const fallbackId = await findFallbackCompanyId();
  if (fallbackId) {
    return fallbackId;
  }

  throw new Error("No company is selected. Select or create a company first.");
};

export const requestWithCompanyFallback = async <T>(
  preferredCompanyId: string | undefined,
  request: (companyId: string) => Promise<T>,
): Promise<T> => {
  const initialCompanyId = await resolveCompanyId(preferredCompanyId);

  try {
    return await request(initialCompanyId);
  } catch (error: any) {
    const shouldRetryWithFallback =
      error?.response?.status === 404 &&
      (!preferredCompanyId || preferredCompanyId === initialCompanyId);

    if (!shouldRetryWithFallback) {
      throw error;
    }

    const fallbackId = await findFallbackCompanyId();
    if (!fallbackId || fallbackId === initialCompanyId) {
      throw error;
    }

    return request(fallbackId);
  }
};
