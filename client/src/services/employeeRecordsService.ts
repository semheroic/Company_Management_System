import axios from "axios";
import {
  COMPANY_BASE_URL,
  requestWithCompanyFallback,
} from "./companyApi";

export type EmployeeStatus = "active" | "inactive" | "terminated";

export interface EmployeeRecord {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  position: string;
  department: string;
  startDate: string;
  grossSalary: number;
  rssbNumber: string;
  status: EmployeeStatus;
  contractFileName?: string | null;
  contractFilePath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSummary {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  terminatedEmployees: number;
  averageSalary: number;
}

export interface CreateEmployeeInput {
  fullName: string;
  email?: string;
  phone?: string;
  nationalId: string;
  position: string;
  department: string;
  startDate: string;
  grossSalary: number;
  rssbNumber?: string;
  status?: EmployeeStatus;
  contract?: File | null;
}

interface EmployeeApiRecord {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  national_id: string;
  position: string;
  department: string;
  start_date: string;
  gross_salary: number | string;
  rssb_number: string | null;
  status: EmployeeStatus;
  contract_file_name: string | null;
  contract_file_path: string | null;
  created_at: string;
  updated_at: string;
}

interface EmployeeResponse {
  records: EmployeeApiRecord[];
  summary: EmployeeSummary;
}

class EmployeeRecordsService {
  static async getAll(companyId?: string): Promise<{ records: EmployeeRecord[]; summary: EmployeeSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<EmployeeResponse>(`${COMPANY_BASE_URL}/${targetId}/employees`, {
        headers: { "x-company-id": targetId },
      });

      return {
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
        summary: {
          ...response.data.summary,
          averageSalary: Number(response.data.summary?.averageSalary || 0),
        },
      };
    });
  }

  static async create(input: CreateEmployeeInput, companyId?: string): Promise<EmployeeRecord> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const formData = new FormData();
      formData.append("full_name", input.fullName);
      formData.append("national_id", input.nationalId);
      formData.append("position", input.position);
      formData.append("department", input.department);
      formData.append("start_date", input.startDate);
      formData.append("gross_salary", String(input.grossSalary));
      if (input.email) formData.append("email", input.email);
      if (input.phone) formData.append("phone", input.phone);
      if (input.rssbNumber) formData.append("rssb_number", input.rssbNumber);
      if (input.status) formData.append("status", input.status);
      if (input.contract) formData.append("contract", input.contract);

      const response = await axios.post<EmployeeApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/employees`,
        formData,
        { headers: { "x-company-id": targetId } },
      );

      return this.mapRecord(response.data);
    });
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private static mapRecord(record: EmployeeApiRecord): EmployeeRecord {
    return {
      id: Number(record.id),
      fullName: record.full_name,
      email: record.email || "",
      phone: record.phone || "",
      nationalId: record.national_id,
      position: record.position,
      department: record.department,
      startDate: record.start_date,
      grossSalary: Number(record.gross_salary || 0),
      rssbNumber: record.rssb_number || "",
      status: record.status,
      contractFileName: record.contract_file_name,
      contractFilePath: record.contract_file_path,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export default EmployeeRecordsService;
