import axios from "axios";
import {
  COMPANY_BASE_URL,
  requestWithCompanyFallback,
} from "./companyApi";
import type { EmployeeRecord } from "./employeeRecordsService";

export interface PayrollRecord {
  id: number;
  employeeId: number;
  month: string;
  payDate: string;
  grossSalary: number;
  paye: number;
  rssbEmployee: number;
  rssbEmployer: number;
  netSalary: number;
  paid: boolean;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee: EmployeeRecord | null;
}

export interface PayrollSummary {
  month?: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalPaye: number;
  totalRssbEmployee: number;
  totalRssbEmployer: number;
  totalNetPay: number;
  paidCount: number;
  unpaidCount: number;
}

export interface PayrollAlert {
  type: "paye" | "rssb" | "contract_expiry";
  message: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
}

interface PayrollApiRecord {
  id: number;
  employee_id: number;
  payroll_month: string;
  pay_date: string;
  gross_salary: number | string;
  paye_tax: number | string;
  rssb_employee: number | string;
  rssb_employer: number | string;
  net_salary: number | string;
  status: "paid" | "unpaid";
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  employee: {
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
    status: "active" | "inactive" | "terminated";
    contract_file_name: string | null;
    contract_file_path: string | null;
  } | null;
}

interface PayrollResponse {
  records: PayrollApiRecord[];
  summary: PayrollSummary;
}

class PayrollRegisterService {
  static async getByMonth(month: string, companyId?: string): Promise<{ records: PayrollRecord[]; summary: PayrollSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<PayrollResponse>(
        `${COMPANY_BASE_URL}/${targetId}/payroll-records`,
        {
          headers: { "x-company-id": targetId },
          params: { month },
        },
      );

      return {
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
        summary: this.mapSummary(response.data.summary, month),
      };
    });
  }

  static async generate(month: string, payDate?: string, companyId?: string): Promise<{ records: PayrollRecord[]; summary: PayrollSummary }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.post<PayrollResponse>(
        `${COMPANY_BASE_URL}/${targetId}/payroll-records/generate`,
        {
          payroll_month: month,
          pay_date: payDate,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": targetId,
          },
        },
      );

      return {
        records: (response.data.records || []).map((record) => this.mapRecord(record)),
        summary: this.mapSummary(response.data.summary, month),
      };
    });
  }

  static async markAsPaid(payrollId: number, companyId?: string): Promise<PayrollRecord> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.patch<PayrollApiRecord>(
        `${COMPANY_BASE_URL}/${targetId}/payroll-records/${payrollId}/paid`,
        {},
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

  static getComplianceAlerts(records: PayrollRecord[], month: string): PayrollAlert[] {
    const alerts: PayrollAlert[] = [];
    const dueDate = `${month}-15`;
    const unpaidCount = records.filter((record) => !record.paid).length;

    if (records.length === 0) {
      alerts.push({
        type: "paye",
        message: `Payroll for ${month} has not been generated.`,
        dueDate,
        priority: "high",
      });
    }

    if (unpaidCount > 0) {
      alerts.push({
        type: "rssb",
        message: `${unpaidCount} payroll record(s) are still unpaid.`,
        dueDate,
        priority: unpaidCount > 3 ? "high" : "medium",
      });
    }

    return alerts;
  }

  static exportToCSV(records: PayrollRecord[]): string {
    const headers = [
      "Employee Name",
      "National ID",
      "Position",
      "Department",
      "Gross Salary",
      "PAYE",
      "RSSB Employee",
      "RSSB Employer",
      "Net Salary",
      "Paid Status",
    ];

    const rows = records.map((record) => [
      record.employee?.fullName || "",
      record.employee?.nationalId || "",
      record.employee?.position || "",
      record.employee?.department || "",
      record.grossSalary,
      record.paye,
      record.rssbEmployee,
      record.rssbEmployer,
      record.netSalary,
      record.paid ? "Paid" : "Unpaid",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value)}"`).join(","))
      .join("\n");
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private static mapSummary(summary: PayrollSummary, month: string): PayrollSummary {
    return {
      month,
      totalEmployees: Number(summary?.totalEmployees || 0),
      totalGrossPay: Number(summary?.totalGrossPay || 0),
      totalPaye: Number(summary?.totalPaye || 0),
      totalRssbEmployee: Number(summary?.totalRssbEmployee || 0),
      totalRssbEmployer: Number(summary?.totalRssbEmployer || 0),
      totalNetPay: Number(summary?.totalNetPay || 0),
      paidCount: Number(summary?.paidCount || 0),
      unpaidCount: Number(summary?.unpaidCount || 0),
    };
  }

  private static mapRecord(record: PayrollApiRecord): PayrollRecord {
    return {
      id: Number(record.id),
      employeeId: Number(record.employee_id),
      month: record.payroll_month,
      payDate: record.pay_date,
      grossSalary: Number(record.gross_salary || 0),
      paye: Number(record.paye_tax || 0),
      rssbEmployee: Number(record.rssb_employee || 0),
      rssbEmployer: Number(record.rssb_employer || 0),
      netSalary: Number(record.net_salary || 0),
      paid: record.status === "paid",
      paidAt: record.paid_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      employee: record.employee
        ? {
            id: Number(record.employee.id),
            fullName: record.employee.full_name,
            email: record.employee.email || "",
            phone: record.employee.phone || "",
            nationalId: record.employee.national_id,
            position: record.employee.position,
            department: record.employee.department,
            startDate: record.employee.start_date,
            grossSalary: Number(record.employee.gross_salary || 0),
            rssbNumber: record.employee.rssb_number || "",
            status: record.employee.status,
            contractFileName: record.employee.contract_file_name,
            contractFilePath: record.employee.contract_file_path,
            createdAt: "",
            updatedAt: "",
          }
        : null,
    };
  }
}

export default PayrollRegisterService;
