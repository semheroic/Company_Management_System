import { jsPDF } from "jspdf";
import AccountingBooksService from "./accountingBooksService";
import PayrollRegisterService from "./payrollRegisterService";
import ComplianceCalendarService from "./complianceCalendarService";
import ComplianceAlertService from "./complianceAlertService";
import InternalAuditReportService from "./internalAuditReportService";
import TaxReturnRegisterService from "./taxReturnRegisterService";
import InvoiceRegisterService from "./invoiceRegisterService";
import CompanyCapitalService from "./companyCapitalService";
import BeneficialOwnerService from "./beneficialOwnerService";
import DividendService from "./dividendService";
import EmployeeRecordsService from "./employeeRecordsService";

type ReportPrimitive = string | number | boolean | null | undefined;
type ReportValue = ReportPrimitive | Record<string, unknown> | unknown[];

export interface ReportData {
  title: string;
  data: Record<string, ReportValue>;
  generatedAt: string;
  period?: string;
}

export interface ReportGenerationOptions {
  from?: string;
  to?: string;
  asOfDate?: string;
  month?: string;
}

export interface AuditTrailEvent {
  id: string;
  action_type: "create" | "update" | "delete" | "view" | "export" | "sync";
  table_name: string;
  record_id: string;
  changed_by: string;
  user_name: string;
  description: string;
  changed_at: string;
  old_data?: unknown;
  new_data?: unknown;
}

interface ResolvedReportOptions {
  from: string;
  to: string;
  asOfDate: string;
  month: string;
}

const todayIso = () => new Date().toISOString().split("T")[0];

const monthStartIso = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
};

const toNumber = (value: unknown) => Number(value || 0);

const formatMonthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString("en-RW", {
    month: "long",
    year: "numeric",
  });

const getMonthKeysInRange = (from: string, to: string): string[] => {
  const keys: string[] = [];
  const cursor = new Date(`${from}T00:00:00`);
  cursor.setDate(1);
  const end = new Date(`${to}T00:00:00`);
  end.setDate(1);

  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
};

const isDateWithinRange = (value: string | null | undefined, from: string, to: string) => {
  if (!value) {
    return false;
  }

  const normalized = value.slice(0, 10);
  return normalized >= from && normalized <= to;
};

const resolveOptions = (options?: ReportGenerationOptions): ResolvedReportOptions => {
  const from = options?.from || monthStartIso();
  const to = options?.to || todayIso();
  const asOfDate = options?.asOfDate || to;
  const month = options?.month || from.slice(0, 7);

  return { from, to, asOfDate, month };
};

const buildPeriodLabel = (options: ResolvedReportOptions) => {
  if (options.from === options.to) {
    return `As of ${options.to}`;
  }

  return `${options.from} to ${options.to}`;
};

class ReportService {
  static async generateFinancialSummary(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const trialBalance = await AccountingBooksService.getTrialBalance(undefined, resolved.asOfDate);

    const revenue = trialBalance
      .filter((entry) => entry.code.startsWith("4"))
      .reduce((sum, entry) => sum + toNumber(entry.total_credit), 0);
    const expenses = trialBalance
      .filter((entry) => entry.code.startsWith("5"))
      .reduce((sum, entry) => sum + toNumber(entry.total_debit), 0);
    const assets = trialBalance
      .filter((entry) => entry.code.startsWith("1"))
      .reduce((sum, entry) => sum + Math.abs(toNumber(entry.net_balance)), 0);
    const liabilities = trialBalance
      .filter((entry) => entry.code.startsWith("2"))
      .reduce((sum, entry) => sum + Math.abs(toNumber(entry.net_balance)), 0);
    const equity = trialBalance
      .filter((entry) => entry.code.startsWith("3"))
      .reduce((sum, entry) => sum + Math.abs(toNumber(entry.net_balance)), 0);

    return {
      title: "Financial Summary",
      data: {
        revenue,
        expenses,
        net_profit: revenue - expenses,
        assets,
        liabilities,
        equity,
        accounts_with_activity: trialBalance.filter(
          (entry) => toNumber(entry.total_debit) > 0 || toNumber(entry.total_credit) > 0,
        ).length,
      },
      generatedAt: new Date().toISOString(),
      period: `As of ${resolved.asOfDate}`,
    };
  }

  static async generateTrialBalanceReport(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const trialBalance = await AccountingBooksService.getTrialBalance(undefined, resolved.asOfDate);
    const activeAccounts = trialBalance.filter(
      (entry) => toNumber(entry.total_debit) > 0 || toNumber(entry.total_credit) > 0,
    );
    const totalDebits = activeAccounts.reduce((sum, entry) => sum + toNumber(entry.total_debit), 0);
    const totalCredits = activeAccounts.reduce((sum, entry) => sum + toNumber(entry.total_credit), 0);
    const difference = Math.abs(totalDebits - totalCredits);

    return {
      title: "Trial Balance Report",
      data: {
        total_accounts: activeAccounts.length,
        total_debits: totalDebits,
        total_credits: totalCredits,
        difference,
        balanced: difference < 0.01,
        largest_accounts: activeAccounts
          .sort(
            (left, right) =>
              Math.abs(toNumber(right.net_balance)) - Math.abs(toNumber(left.net_balance)),
          )
          .slice(0, 5)
          .map(
            (entry) =>
              `${entry.code} ${entry.name}: ${this.formatCurrency(Math.abs(toNumber(entry.net_balance)))}`,
          ),
      },
      generatedAt: new Date().toISOString(),
      period: `As of ${resolved.asOfDate}`,
    };
  }

  static async generatePayrollReport(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const monthKeys = getMonthKeysInRange(resolved.from, resolved.to);
    const payrollResponses = await Promise.all(monthKeys.map((month) => PayrollRegisterService.getByMonth(month)));
    const summary = payrollResponses.reduce(
      (accumulator, response) => ({
        totalEmployees: Math.max(accumulator.totalEmployees, response.summary.totalEmployees),
        totalGrossPay: accumulator.totalGrossPay + response.summary.totalGrossPay,
        totalPaye: accumulator.totalPaye + response.summary.totalPaye,
        totalRssbEmployee: accumulator.totalRssbEmployee + response.summary.totalRssbEmployee,
        totalRssbEmployer: accumulator.totalRssbEmployer + response.summary.totalRssbEmployer,
        totalNetPay: accumulator.totalNetPay + response.summary.totalNetPay,
        paidCount: accumulator.paidCount + response.summary.paidCount,
        unpaidCount: accumulator.unpaidCount + response.summary.unpaidCount,
      }),
      {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalPaye: 0,
        totalRssbEmployee: 0,
        totalRssbEmployer: 0,
        totalNetPay: 0,
        paidCount: 0,
        unpaidCount: 0,
      },
    );

    return {
      title: "Payroll Report",
      data: {
        total_employees: summary.totalEmployees,
        total_gross_salary: summary.totalGrossPay,
        total_paye_tax: summary.totalPaye,
        total_rssb_employee: summary.totalRssbEmployee,
        total_rssb_employer: summary.totalRssbEmployer,
        total_net_pay: summary.totalNetPay,
        paid_records: summary.paidCount,
        unpaid_records: summary.unpaidCount,
      },
      generatedAt: new Date().toISOString(),
      period: monthKeys.length > 1 ? buildPeriodLabel(resolved) : formatMonthLabel(resolved.month),
    };
  }

  static async generateVATReport(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const taxReturns = await TaxReturnRegisterService.getAll();
    const periodReturns = taxReturns.records.filter((record) =>
      isDateWithinRange(
        record.submissionDate || record.dueDate || record.createdAt,
        resolved.from,
        resolved.to,
      ),
    );

    const totalByType = (keyword: string) =>
      periodReturns
        .filter((record) => record.taxType.toLowerCase().includes(keyword))
        .reduce((sum, record) => sum + toNumber(record.totalDeclared), 0);

    return {
      title: "Tax Filing Bundle",
      data: {
        total_returns: periodReturns.length,
        filed_returns: periodReturns.filter((record) => record.status === "Filed").length,
        pending_returns: periodReturns.filter((record) => record.status === "Pending").length,
        overdue_returns: periodReturns.filter((record) => record.status === "Overdue").length,
        total_declared: periodReturns.reduce((sum, record) => sum + toNumber(record.totalDeclared), 0),
        vat_declared: totalByType("vat"),
        paye_declared: totalByType("paye"),
        cit_declared: totalByType("cit"),
        qit_declared: totalByType("qit"),
      },
      generatedAt: new Date().toISOString(),
      period: buildPeriodLabel(resolved),
    };
  }

  static async generateComplianceStatus(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const [alerts, deadlines, taxReturns, beneficialOwners, ownershipValidation] = await Promise.all([
      ComplianceAlertService.getAll(),
      ComplianceCalendarService.getAll(),
      TaxReturnRegisterService.getAll(),
      BeneficialOwnerService.getAllBeneficialOwners(),
      BeneficialOwnerService.validateOwnershipPercentages().catch(() => ({
        isValid: true,
        totalPercentage: 0,
        violations: [] as string[],
      })),
    ]);

    const overdueDeadlines = deadlines.records.filter((record) => record.status === "overdue").length;
    const expiringSoon = deadlines.records.filter(
      (record) => record.status !== "completed" && isDateWithinRange(record.dueDate, resolved.from, resolved.to),
    ).length;
    const pendingTaxReturns = taxReturns.records.filter((record) => record.status !== "Filed").length;
    const unverifiedOwners = beneficialOwners.filter(
      (owner) => owner.verification_status !== "verified",
    ).length;
    const totalRegisters = 4;
    const upToDateRegisters = [
      alerts.summary.active === 0,
      overdueDeadlines === 0,
      pendingTaxReturns === 0,
      ownershipValidation.isValid && unverifiedOwners === 0,
    ].filter(Boolean).length;
    const pendingUpdates =
      alerts.summary.active + overdueDeadlines + pendingTaxReturns + unverifiedOwners;
    const complianceScore = Math.max(
      0,
      100 - alerts.summary.active * 5 - overdueDeadlines * 12 - pendingTaxReturns * 10 - unverifiedOwners * 4,
    );

    return {
      title: "Compliance Status",
      data: {
        total_registers: totalRegisters,
        up_to_date_registers: upToDateRegisters,
        pending_updates: pendingUpdates,
        active_alerts: alerts.summary.active,
        overdue_deadlines: overdueDeadlines,
        upcoming_deadlines: expiringSoon,
        pending_tax_returns: pendingTaxReturns,
        unverified_beneficial_owners: unverifiedOwners,
        ownership_validation: ownershipValidation.isValid ? "Valid" : ownershipValidation.violations.join("; "),
        compliance_score: complianceScore,
      },
      generatedAt: new Date().toISOString(),
      period: buildPeriodLabel(resolved),
    };
  }

  static async getAuditTrailEvents(options?: ReportGenerationOptions): Promise<AuditTrailEvent[]> {
    const resolved = resolveOptions(options);
    const monthKeys = getMonthKeysInRange(resolved.from, resolved.to);

    const [accountingBooks, payrollResponses, taxReturns, audits, invoices, alerts] = await Promise.all([
      AccountingBooksService.getAccountingBooks(),
      Promise.all(monthKeys.map((month) => PayrollRegisterService.getByMonth(month))),
      TaxReturnRegisterService.getAll(),
      InternalAuditReportService.getAll(),
      InvoiceRegisterService.getAll(),
      ComplianceAlertService.getAll(),
    ]);

    const journalMap = new Map<number, (typeof accountingBooks.entries)[number]>();
    accountingBooks.entries
      .filter((entry) => isDateWithinRange(entry.date || entry.created_at, resolved.from, resolved.to))
      .forEach((entry) => {
        if (!journalMap.has(entry.journal_entry_id)) {
          journalMap.set(entry.journal_entry_id, entry);
        }
      });

    const journalEvents: AuditTrailEvent[] = Array.from(journalMap.values()).map((entry) => ({
      id: `journal-${entry.journal_entry_id}`,
      action_type: entry.status === "cancelled" ? "delete" : entry.status === "reversal" ? "update" : "create",
      table_name: "accounting_books",
      record_id: entry.reference || String(entry.journal_entry_id),
      changed_by: "system",
      user_name: "System",
      description:
        entry.status === "cancelled"
          ? `Cancelled journal ${entry.reference || entry.journal_entry_id}`
          : `Posted journal ${entry.reference || entry.journal_entry_id} for ${entry.source_type}`,
      changed_at: entry.created_at || `${entry.date}T00:00:00`,
      new_data: {
        status: entry.status,
        source_type: entry.source_type,
      },
    }));

    const payrollEvents: AuditTrailEvent[] = payrollResponses
      .filter((response) => response.records.length > 0)
      .map((response) => ({
        id: `payroll-${response.summary.month}`,
        action_type: response.summary.unpaidCount > 0 ? "update" : "create",
        table_name: "payroll_records",
        record_id: response.summary.month || "",
        changed_by: "system",
        user_name: "System",
        description: `Processed payroll for ${response.summary.month} (${response.summary.totalEmployees} employees)`,
        changed_at:
          response.records
            .map((record) => record.updatedAt || record.payDate)
            .sort()
            .slice(-1)[0] || `${response.summary.month}-01T00:00:00`,
        new_data: response.summary,
      }));

    const taxEvents: AuditTrailEvent[] = taxReturns.records
      .filter((record) => isDateWithinRange(record.submissionDate || record.dueDate, resolved.from, resolved.to))
      .map((record) => ({
        id: `tax-${record.id}`,
        action_type: record.status === "Filed" ? "update" : "create",
        table_name: "tax_returns",
        record_id: String(record.id),
        changed_by: "system",
        user_name: "System",
        description: `${record.taxType} return ${record.status.toLowerCase()} for ${record.period}`,
        changed_at: record.submissionDate || record.updatedAt || record.dueDate,
        new_data: {
          status: record.status,
          total_declared: record.totalDeclared,
        },
      }));

    const auditEvents: AuditTrailEvent[] = audits.records
      .filter((record) => isDateWithinRange(record.reportDate || record.createdAt, resolved.from, resolved.to))
      .map((record) => ({
        id: `internal-audit-${record.id}`,
        action_type: record.status.toLowerCase().includes("complete") ? "update" : "create",
        table_name: "internal_audit_reports",
        record_id: String(record.id),
        changed_by: "system",
        user_name: record.auditor || "Auditor",
        description: `${record.title} audit report is ${record.status.toLowerCase()}`,
        changed_at: record.reportDate || record.updatedAt || record.createdAt,
        new_data: {
          findings: record.findings,
          status: record.status,
        },
      }));

    const invoiceEvents: AuditTrailEvent[] = invoices.records
      .filter((record) => isDateWithinRange(record.date || record.created_at, resolved.from, resolved.to))
      .map((record) => ({
        id: `invoice-${record.id}`,
        action_type: record.status === "cancelled" ? "delete" : "create",
        table_name: "invoices_receipts",
        record_id: record.number || String(record.id),
        changed_by: "system",
        user_name: "System",
        description: `${record.type === "invoice" ? "Invoice" : "Receipt"} ${record.number} is ${record.status}`,
        changed_at: record.created_at || `${record.date}T00:00:00`,
        new_data: {
          status: record.status,
          total: record.total,
        },
      }));

    const alertEvents: AuditTrailEvent[] = alerts.records
      .filter((record) => isDateWithinRange(record.createdAt || record.dueDate, resolved.from, resolved.to))
      .map((record) => ({
        id: `alert-${record.id}`,
        action_type: record.status === "resolved" ? "update" : "create",
        table_name: "compliance_alerts",
        record_id: String(record.id),
        changed_by: "system",
        user_name: "System",
        description: `Compliance alert ${record.title} is ${record.status}`,
        changed_at: record.updatedAt || record.createdAt || record.dueDate,
        new_data: {
          priority: record.priority,
          status: record.status,
        },
      }));

    return [
      ...journalEvents,
      ...payrollEvents,
      ...taxEvents,
      ...auditEvents,
      ...invoiceEvents,
      ...alertEvents,
    ].sort((left, right) => new Date(right.changed_at).getTime() - new Date(left.changed_at).getTime());
  }

  static async generateAuditTrail(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const events = await this.getAuditTrailEvents(resolved);

    return {
      title: "Audit Trail",
      data: {
        total_events: events.length,
        accounting_events: events.filter((event) => event.table_name === "accounting_books").length,
        payroll_events: events.filter((event) => event.table_name === "payroll_records").length,
        tax_events: events.filter((event) => event.table_name === "tax_returns").length,
        flagged_events: events.filter(
          (event) => event.action_type === "delete" || /cancelled|overdue|pending/i.test(event.description),
        ).length,
        latest_activity: events[0]?.changed_at || "No activity found",
        recent_activity: events.slice(0, 5).map((event) => event.description),
      },
      generatedAt: new Date().toISOString(),
      period: buildPeriodLabel(resolved),
    };
  }

  static async generatePerformanceDashboard(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const monthKeys = getMonthKeysInRange(resolved.from, resolved.to);

    const [employees, taxReturns, audits, invoices, payrollResponses] = await Promise.all([
      EmployeeRecordsService.getAll(),
      TaxReturnRegisterService.getAll(),
      InternalAuditReportService.getAll(),
      InvoiceRegisterService.getAll(),
      Promise.all(monthKeys.map((month) => PayrollRegisterService.getByMonth(month))),
    ]);

    const periodInvoices = invoices.records.filter((record) =>
      isDateWithinRange(record.date || record.created_at, resolved.from, resolved.to),
    );
    const totalRevenue = periodInvoices
      .filter((record) => record.type === "invoice")
      .reduce((sum, record) => sum + toNumber(record.total), 0);
    const totalPurchases = periodInvoices
      .filter((record) => record.type === "receipt")
      .reduce((sum, record) => sum + toNumber(record.total), 0);
    const totalPayroll = payrollResponses.reduce((sum, response) => sum + response.summary.totalGrossPay, 0);
    const totalTax = taxReturns.records
      .filter((record) => isDateWithinRange(record.submissionDate || record.dueDate, resolved.from, resolved.to))
      .reduce((sum, record) => sum + toNumber(record.totalDeclared), 0);
    const paidInvoices = periodInvoices.filter(
      (record) => record.type === "invoice" && ["paid", "partially_paid"].includes(record.status),
    ).length;
    const totalInvoices = periodInvoices.filter((record) => record.type === "invoice").length;
    const paidPayroll = payrollResponses.reduce((sum, response) => sum + response.summary.paidCount, 0);
    const totalPayrollRecords = payrollResponses.reduce((sum, response) => sum + response.records.length, 0);
    const filedReturns = taxReturns.records.filter((record) => record.status === "Filed").length;
    const totalReturns = taxReturns.records.length;

    return {
      title: "Performance Dashboard",
      data: {
        revenue: totalRevenue,
        expenses: totalPurchases + totalPayroll + totalTax,
        profit_margin: totalRevenue > 0 ? ((totalRevenue - totalPurchases - totalPayroll - totalTax) / totalRevenue) * 100 : 0,
        invoice_collection_rate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
        payroll_completion_rate: totalPayrollRecords > 0 ? (paidPayroll / totalPayrollRecords) * 100 : 0,
        tax_filing_rate: totalReturns > 0 ? (filedReturns / totalReturns) * 100 : 0,
        audit_completion_rate:
          audits.summary.totalReports > 0
            ? (audits.summary.completed / audits.summary.totalReports) * 100
            : 0,
        workforce_utilization:
          employees.summary.totalEmployees > 0
            ? (employees.summary.activeEmployees / employees.summary.totalEmployees) * 100
            : 0,
      },
      generatedAt: new Date().toISOString(),
      period: buildPeriodLabel(resolved),
    };
  }

  static async generateOwnershipReport(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const [companyCapital, shareholders, beneficialOwners, ownershipValidation] = await Promise.all([
      CompanyCapitalService.getCompanyCapitalFromApi(),
      CompanyCapitalService.getAllShareholdersFromApi(),
      BeneficialOwnerService.getAllBeneficialOwners(),
      BeneficialOwnerService.validateOwnershipPercentages().catch(() => ({
        isValid: true,
        totalPercentage: 0,
        violations: [] as string[],
      })),
    ]);

    return {
      title: "Ownership & Control Report",
      data: {
        authorized_shares: companyCapital?.authorized_shares || 0,
        issued_shares: companyCapital?.issued_shares || 0,
        paid_up_capital: companyCapital?.paid_up_capital || 0,
        total_shareholders: shareholders.length,
        total_beneficial_owners: beneficialOwners.length,
        significant_controllers: beneficialOwners.filter((owner) => owner.has_significant_control).length,
        verified_owners: beneficialOwners.filter((owner) => owner.verification_status === "verified").length,
        ownership_validation: ownershipValidation.isValid ? "Valid" : ownershipValidation.violations.join("; "),
        top_shareholders: shareholders
          .slice()
          .sort((left, right) => right.share_percentage - left.share_percentage)
          .slice(0, 5)
          .map((shareholder) => `${shareholder.name}: ${shareholder.share_percentage.toFixed(2)}%`),
      },
      generatedAt: new Date().toISOString(),
      period: `As of ${resolved.asOfDate}`,
    };
  }

  static async generateCapitalReport(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const [companyCapital, shareholders, contributions] = await Promise.all([
      CompanyCapitalService.getCompanyCapitalFromApi(),
      CompanyCapitalService.getAllShareholdersFromApi(),
      CompanyCapitalService.getCapitalContributionsFromApi(),
    ]);

    const authorizedCapital =
      (companyCapital?.authorized_shares || 0) * (companyCapital?.share_price || 0);
    const issuedCapital = (companyCapital?.issued_shares || 0) * (companyCapital?.share_price || 0);
    const confirmedContributions = contributions.filter((entry) => entry.status === "confirmed");

    return {
      title: "Capital Structure Report",
      data: {
        authorized_capital: authorizedCapital,
        issued_capital: issuedCapital,
        paid_up_capital: companyCapital?.paid_up_capital || 0,
        share_price: companyCapital?.share_price || 0,
        total_shareholders: shareholders.length,
        total_contributions: contributions.length,
        confirmed_contributions: confirmedContributions.length,
        pending_contributions: contributions.filter((entry) => entry.status === "pending").length,
        remaining_shares: Math.max((companyCapital?.authorized_shares || 0) - (companyCapital?.issued_shares || 0), 0),
        utilization_rate:
          companyCapital && companyCapital.authorized_shares > 0
            ? (companyCapital.issued_shares / companyCapital.authorized_shares) * 100
            : 0,
        latest_contribution: confirmedContributions[0]?.contribution_date || "No confirmed contribution",
        summary_snapshot: {
          authorized_shares: companyCapital?.authorized_shares || 0,
          issued_shares: companyCapital?.issued_shares || 0,
        },
      },
      generatedAt: new Date().toISOString(),
      period: `As of ${resolved.asOfDate}`,
    };
  }

  static async generateBeneficialOwnershipReport(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const [beneficialOwners, validation] = await Promise.all([
      BeneficialOwnerService.getAllBeneficialOwners(),
      BeneficialOwnerService.validateOwnershipPercentages().catch(() => ({
        isValid: true,
        totalPercentage: 0,
        violations: [] as string[],
      })),
    ]);

    return {
      title: "Beneficial Ownership Register",
      data: {
        total_beneficial_owners: beneficialOwners.length,
        verified_owners: beneficialOwners.filter((owner) => owner.verification_status === "verified").length,
        significant_controllers: beneficialOwners.filter((owner) => owner.has_significant_control).length,
        pending_verifications: beneficialOwners.filter((owner) => owner.verification_status === "pending").length,
        ownership_total_percentage: validation.totalPercentage,
        validation_status: validation.isValid ? "Valid" : validation.violations.join("; "),
        nationalities: [...new Set(beneficialOwners.map((owner) => owner.nationality).filter(Boolean))],
      },
      generatedAt: new Date().toISOString(),
      period: `As of ${resolved.asOfDate}`,
    };
  }

  static async generateDividendReport(options?: ReportGenerationOptions): Promise<ReportData> {
    const resolved = resolveOptions(options);
    const declarations = await DividendService.getAllDeclarationsFromApi();
    const periodDeclarations = declarations.filter((declaration) =>
      isDateWithinRange(declaration.declaration_date, resolved.from, resolved.to),
    );
    const distributions = await Promise.all(
      periodDeclarations.map((declaration) =>
        DividendService.getDistributionsByDeclarationFromApi(declaration.id),
      ),
    );
    const flatDistributions = distributions.flat();

    return {
      title: "Dividend Distribution Report",
      data: {
        total_declarations: periodDeclarations.length,
        total_dividend_pool: periodDeclarations.reduce((sum, declaration) => sum + declaration.dividend_pool, 0),
        approved_declarations: periodDeclarations.filter((declaration) => declaration.status === "approved").length,
        paid_declarations: periodDeclarations.filter((declaration) => declaration.status === "paid").length,
        cancelled_declarations: periodDeclarations.filter((declaration) => declaration.status === "cancelled").length,
        shareholder_distributions: flatDistributions.length,
        paid_distributions: flatDistributions.filter((distribution) => Boolean(distribution.paid_at)).length,
        allocated_amount: flatDistributions.reduce((sum, distribution) => sum + distribution.amount_allocated, 0),
      },
      generatedAt: new Date().toISOString(),
      period: buildPeriodLabel(resolved),
    };
  }

  static async generateComprehensiveComplianceReport(options?: ReportGenerationOptions): Promise<ReportData> {
    const [complianceStatus, ownershipReport, capitalReport, beneficialOwnershipReport, auditTrail] =
      await Promise.all([
        this.generateComplianceStatus(options),
        this.generateOwnershipReport(options),
        this.generateCapitalReport(options),
        this.generateBeneficialOwnershipReport(options),
        this.generateAuditTrail(options),
      ]);

    return {
      title: "Comprehensive Compliance Report",
      data: {
        compliance_score: complianceStatus.data.compliance_score,
        pending_updates: complianceStatus.data.pending_updates,
        ownership_validation: ownershipReport.data.ownership_validation,
        utilization_rate: capitalReport.data.utilization_rate,
        pending_bo_verifications: beneficialOwnershipReport.data.pending_verifications,
        flagged_audit_events: auditTrail.data.flagged_events,
      },
      generatedAt: new Date().toISOString(),
      period: complianceStatus.period,
    };
  }

  static async generatePDF(reportData: ReportData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = 20;

    const ensureSpace = (heightNeeded = 8) => {
      if (yPosition + heightNeeded > pageHeight - 18) {
        doc.addPage();
        yPosition = 20;
      }
    };

    const writeText = (text: string, options?: { indent?: number; bold?: boolean }) => {
      const indent = options?.indent || 0;
      doc.setFont("helvetica", options?.bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      ensureSpace(lines.length * 6 + 2);
      doc.text(lines, margin + indent, yPosition);
      yPosition += lines.length * 6 + 2;
    };

    const renderValue = (label: string, value: ReportValue, depth = 0) => {
      const indent = depth * 6;
      const formattedLabel = this.formatLabel(label);

      if (Array.isArray(value)) {
        writeText(formattedLabel, { indent, bold: depth === 0 });

        if (!value.length) {
          writeText("None", { indent: indent + 6 });
          return;
        }

        value.slice(0, 8).forEach((item, index) => {
          if (item && typeof item === "object") {
            writeText(`Item ${index + 1}`, { indent: indent + 6, bold: true });
            Object.entries(item as Record<string, ReportValue>).forEach(([key, nestedValue]) => {
              renderValue(key, nestedValue, depth + 2);
            });
            return;
          }

          writeText(`- ${this.formatValue(label, item as ReportPrimitive)}`, { indent: indent + 6 });
        });

        if (value.length > 8) {
          writeText(`+ ${value.length - 8} more item(s)`, { indent: indent + 6 });
        }
        return;
      }

      if (value && typeof value === "object") {
        writeText(formattedLabel, { indent, bold: depth === 0 });
        Object.entries(value as Record<string, ReportValue>).forEach(([key, nestedValue]) => {
          renderValue(key, nestedValue, depth + 1);
        });
        return;
      }

      writeText(`${formattedLabel}: ${this.formatValue(label, value)}`, { indent });
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(reportData.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 7;

    if (reportData.period) {
      doc.text(`Period: ${reportData.period}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;
    } else {
      yPosition += 5;
    }

    doc.setFontSize(11);
    Object.entries(reportData.data).forEach(([key, value]) => {
      renderValue(key, value);
    });

    doc.save(`${reportData.title.toLowerCase().replace(/\s+/g, "-")}-${todayIso()}.pdf`);
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private static formatLabel(label: string) {
    return label
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (value) => value.toUpperCase());
  }

  private static formatValue(label: string, value: ReportPrimitive) {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "number") {
      if (/(margin|percentage|rate|score)/i.test(label)) {
        return `${value.toFixed(2)}%`;
      }

      if (/(amount|revenue|expense|profit|asset|liabilit|equity|capital|salary|pay|purchase|declared|pool|allocated|tax)/i.test(label)) {
        return this.formatCurrency(value);
      }

      return new Intl.NumberFormat("en-RW", {
        maximumFractionDigits: 2,
      }).format(value);
    }

    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    return String(value);
  }
}

export default ReportService;
