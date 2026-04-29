import axios from "axios";
import {
  API_BASE,
  COMPANY_BASE_URL,
  getCompanyHeaders,
  requestWithCompanyFallback,
} from "./companyApi";

export interface ClientSupplierRecord {
  id: number;
  name: string;
  type: "Client" | "Supplier";
  category: "Company" | "Individual";
  taxId: string;
  contactPerson?: string | null;
  contact: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  agreementFileName?: string | null;
  agreementFilePath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientSupplierSummary {
  totalContacts: number;
  clients: number;
  suppliers: number;
  active: number;
}

export interface CreateClientSupplierInput {
  name: string;
  type: "client" | "supplier";
  category: "company" | "individual";
  taxId: string;
  contactPerson?: string;
  phone: string;
  email: string;
  file?: File | null;
  status?: "Active" | "Inactive";
}

interface ClientSupplierApiRecord {
  id: number;
  name: string;
  type: "client" | "supplier";
  category: "company" | "individual";
  tax_id: string;
  contact_person: string | null;
  phone: string;
  email: string;
  agreement_file_name: string | null;
  agreement_file_path: string | null;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

interface ClientSupplierResponse {
  records: ClientSupplierApiRecord[];
  summary: ClientSupplierSummary;
}

class ClientSupplierRegisterService {
  static readonly apiBase = API_BASE;

  static async getAll(
    companyId?: string,
  ): Promise<{ records: ClientSupplierRecord[]; summary: ClientSupplierSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<ClientSupplierResponse>(
        `${COMPANY_BASE_URL}/${targetId}/client-suppliers`,
        getCompanyHeaders(targetId),
      );

      return {
        ...response.data,
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
      };
    });
  }

  static async create(input: CreateClientSupplierInput, companyId?: string): Promise<ClientSupplierRecord> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const payload = new FormData();
      payload.append("name", input.name);
      payload.append("type", input.type);
      payload.append("category", input.category);
      payload.append("tax_id", input.taxId);
      payload.append("phone", input.phone);
      payload.append("email", input.email);

      if (input.contactPerson) {
        payload.append("contact_person", input.contactPerson);
      }

      if (input.status) {
        payload.append("status", input.status);
      }

      if (input.file) {
        payload.append("file", input.file);
      }

      const response = await axios.post<ClientSupplierApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/client-suppliers`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-company-id": targetId,
          },
        },
      );

      return this.mapRecord(response.data);
    });
  }

  private static mapRecord(record: ClientSupplierApiRecord): ClientSupplierRecord {
    return {
      id: Number(record.id),
      name: record.name,
      type: record.type === "client" ? "Client" : "Supplier",
      category: record.category === "company" ? "Company" : "Individual",
      taxId: record.tax_id,
      contactPerson: record.contact_person,
      contact: record.email,
      phone: record.phone,
      email: record.email,
      status: record.status,
      agreementFileName: record.agreement_file_name,
      agreementFilePath: record.agreement_file_path,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export default ClientSupplierRegisterService;
