import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActionLoadingState from "@/components/common/ActionLoadingState";
import ReportsHeader from "@/components/reports/ReportsHeader";
import ReportMetrics from "@/components/reports/ReportMetrics";
import ReportCharts from "@/components/reports/ReportCharts";
import QuickReports from "@/components/reports/QuickReports";
import UpcomingDeadlines from "@/components/reports/UpcomingDeadlines";
import TrialBalance from "@/components/reports/TrialBalance";
import EnhancedPaymentMethodAnalytics from "@/components/reports/EnhancedPaymentMethodAnalytics";
import FinancialReportsPanel from "@/components/reports/FinancialReportsPanel";
import AuditLogsPanel from "@/components/reports/AuditLogsPanel";
import { ProductionReadinessDashboard } from "@/components/ProductionReadinessDashboard";
import { useToast } from "@/hooks/use-toast";
import EmployeeRecordsService from "@/services/employeeRecordsService";
import PayrollRegisterService from "@/services/payrollRegisterService";
import ComplianceCalendarService, { type ComplianceDeadline } from "@/services/complianceCalendarService";
import ComplianceAlertService from "@/services/complianceAlertService";
import InternalAuditReportService from "@/services/internalAuditReportService";
import TaxReturnRegisterService from "@/services/taxReturnRegisterService";
import InvoiceRegisterService from "@/services/invoiceRegisterService";

type PeriodOption = "current-month" | "last-month" | "quarter" | "year";

interface RevenueChartPoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

const todayIso = () => new Date().toISOString().split("T")[0];

const getPeriodRange = (period: PeriodOption) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "last-month") {
    start.setMonth(now.getMonth() - 1, 1);
    end.setMonth(now.getMonth(), 0);
  } else if (period === "quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
  } else if (period === "year") {
    start.setMonth(0, 1);
  } else {
    start.setDate(1);
  }

  return {
    from: start.toISOString().split("T")[0],
    to: end.toISOString().split("T")[0],
  };
};

const getMonthKeysInRange = (from: string, to: string) => {
  const months: string[] = [];
  const cursor = new Date(`${from}T00:00:00`);
  cursor.setDate(1);
  const end = new Date(`${to}T00:00:00`);
  end.setDate(1);

  while (cursor <= end) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
};

const isDateWithinRange = (value: string | null | undefined, from: string, to: string) => {
  if (!value) {
    return false;
  }

  const normalized = value.slice(0, 10);
  return normalized >= from && normalized <= to;
};

const formatMonthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString("en-RW", { month: "short" });

export default function ReportsAudit() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("current-month");
  const [selectedRole, setSelectedRole] = useState("owner");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    activeEmployees: 0,
    payrollCost: 0,
    unpaidInvoices: 0,
    upcomingDeadlines: 0,
    complianceStatus: "good",
  });
  const [revenueData, setRevenueData] = useState<RevenueChartPoint[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<ComplianceDeadline[]>([]);

  const periodRange = useMemo(() => getPeriodRange(selectedPeriod), [selectedPeriod]);

  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        const months = getMonthKeysInRange(periodRange.from, periodRange.to);
        const [employees, deadlines, alerts, audits, taxReturns, invoices, payrollResponses] = await Promise.all([
          EmployeeRecordsService.getAll(),
          ComplianceCalendarService.getAll(),
          ComplianceAlertService.getAll(),
          InternalAuditReportService.getAll(),
          TaxReturnRegisterService.getAll(),
          InvoiceRegisterService.getAll(),
          Promise.all(months.map((month) => PayrollRegisterService.getByMonth(month))),
        ]);

        const periodInvoiceRecords = invoices.records.filter((record) =>
          isDateWithinRange(record.date || record.created_at, periodRange.from, periodRange.to),
        );
        const periodTaxReturns = taxReturns.records.filter((record) =>
          isDateWithinRange(record.submissionDate || record.dueDate || record.createdAt, periodRange.from, periodRange.to),
        );
        const payrollCost = payrollResponses.reduce((sum, response) => sum + response.summary.totalGrossPay, 0);
        const purchaseExpense = periodInvoiceRecords
          .filter((record) => record.type === "receipt")
          .reduce((sum, record) => sum + Number(record.total || 0), 0);
        const totalTaxDeclared = periodTaxReturns.reduce((sum, record) => sum + Number(record.totalDeclared || 0), 0);
        const totalRevenue = periodInvoiceRecords
          .filter((record) => record.type === "invoice")
          .reduce((sum, record) => sum + Number(record.total || 0), 0);
        const totalExpenses = purchaseExpense + payrollCost + totalTaxDeclared;

        const visibleDeadlines = deadlines.records
          .filter(
            (deadline) =>
              deadline.status !== "completed" &&
              (isDateWithinRange(deadline.dueDate, periodRange.from, periodRange.to) ||
                deadline.dueDate >= todayIso()),
          )
          .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
          .slice(0, 6)
          .map((deadline) => ({ ...deadline }));

        const chartSeries = months.map((month, index) => {
          const monthInvoices = periodInvoiceRecords.filter((record) => record.date.startsWith(month));
          const monthTaxDeclared = periodTaxReturns
            .filter((record) =>
              (record.submissionDate || record.dueDate || record.createdAt || "").startsWith(month),
            )
            .reduce((sum, record) => sum + Number(record.totalDeclared || 0), 0);

          return {
            month: formatMonthLabel(month),
            revenue: monthInvoices
              .filter((record) => record.type === "invoice")
              .reduce((sum, record) => sum + Number(record.total || 0), 0),
            expenses:
              monthInvoices
                .filter((record) => record.type === "receipt")
                .reduce((sum, record) => sum + Number(record.total || 0), 0) +
              payrollResponses[index].summary.totalGrossPay +
              monthTaxDeclared,
          };
        });

        const breakdown = [
          { name: "Payroll", value: payrollCost, color: "#0f766e" },
          { name: "Purchases", value: purchaseExpense, color: "#f59e0b" },
          { name: "Tax Returns", value: totalTaxDeclared, color: "#2563eb" },
        ].filter((entry) => entry.value > 0);

        setDashboardData({
          totalRevenue,
          totalExpenses,
          profit: totalRevenue - totalExpenses,
          activeEmployees: employees.summary.activeEmployees,
          payrollCost,
          unpaidInvoices: invoices.summary.outstandingInvoices,
          upcomingDeadlines: visibleDeadlines.length,
          complianceStatus:
            alerts.summary.active > 3 ||
            deadlines.summary.overdue > 0 ||
            audits.summary.inProgress > 3 ||
            taxReturns.summary.overdueReturns > 0
              ? "attention"
              : "good",
        });
        setUpcomingDeadlines(visibleDeadlines);
        setRevenueData(chartSeries);
        setExpenseCategories(
          breakdown.length > 0 ? breakdown : [{ name: "No Expenses", value: 1, color: "#94a3b8" }],
        );
      } catch (error) {
        console.error("Failed to load reports and audit overview:", error);
        setRevenueData([]);
        setExpenseCategories([{ name: "No Data", value: 1, color: "#94a3b8" }]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadReportData();
  }, [periodRange.from, periodRange.to]);

  if (isLoading) {
    return (
      <ActionLoadingState
        fullScreen
        title="Loading reports dashboard"
        description={`Pulling ${selectedPeriod.replace("-", " ")} financial, payroll, compliance, and audit data.`}
      />
    );
  }

  const handleMarkDeadlineComplete = async (deadlineId: number) => {
    const targetDeadline = upcomingDeadlines.find((deadline) => deadline.id === deadlineId);
    if (!targetDeadline) {
      return;
    }

    try {
      await ComplianceCalendarService.update(deadlineId, {
        task: targetDeadline.task,
        dueDate: targetDeadline.dueDate,
        priority: targetDeadline.priority,
        department: targetDeadline.department,
        description: targetDeadline.description,
        status: "completed",
        reminderDays: targetDeadline.reminderDays,
      });

      setUpcomingDeadlines((current) => current.filter((deadline) => deadline.id !== deadlineId));
      setDashboardData((current) => ({
        ...current,
        upcomingDeadlines: Math.max(current.upcomingDeadlines - 1, 0),
      }));

      toast({
        title: "Deadline completed",
        description: `${targetDeadline.task} has been marked as completed.`,
      });
    } catch (error) {
      console.error("Failed to complete deadline:", error);
      toast({
        title: "Update failed",
        description: "Could not update the deadline status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <ReportsHeader
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />

        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex h-auto min-w-max gap-2 rounded-xl bg-white p-1 shadow-sm">
              <TabsTrigger value="dashboard" className="whitespace-nowrap px-3 py-2">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="financial-reports" className="whitespace-nowrap px-3 py-2">
                Reports
              </TabsTrigger>
              <TabsTrigger value="trial-balance" className="whitespace-nowrap px-3 py-2">
                Trial Balance
              </TabsTrigger>
              <TabsTrigger value="payment-methods" className="whitespace-nowrap px-3 py-2">
                Payment Analytics
              </TabsTrigger>
              <TabsTrigger value="audit-logs" className="whitespace-nowrap px-3 py-2">
                Audit Trail
              </TabsTrigger>
              <TabsTrigger value="system-status" className="whitespace-nowrap px-3 py-2">
                System Status
              </TabsTrigger>
              <TabsTrigger value="quick-reports" className="whitespace-nowrap px-3 py-2">
                Quick Reports
              </TabsTrigger>
              <TabsTrigger value="deadlines" className="whitespace-nowrap px-3 py-2">
                Deadlines
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-8">
            <ReportMetrics dashboardData={dashboardData} />
            <ReportCharts revenueData={revenueData} expenseCategories={expenseCategories} />
          </TabsContent>

          <TabsContent value="financial-reports">
            <FinancialReportsPanel />
          </TabsContent>

          <TabsContent value="trial-balance">
            <TrialBalance />
          </TabsContent>

          <TabsContent value="payment-methods">
            <EnhancedPaymentMethodAnalytics />
          </TabsContent>

          <TabsContent value="audit-logs">
            <AuditLogsPanel />
          </TabsContent>

          <TabsContent value="system-status">
            <ProductionReadinessDashboard />
          </TabsContent>

          <TabsContent value="quick-reports">
            <QuickReports />
          </TabsContent>

          <TabsContent value="deadlines">
            <UpcomingDeadlines
              upcomingDeadlines={upcomingDeadlines}
              onMarkComplete={handleMarkDeadlineComplete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
