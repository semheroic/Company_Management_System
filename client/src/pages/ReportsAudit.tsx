import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import EmployeeRecordsService from "@/services/employeeRecordsService";
import PayrollRegisterService from "@/services/payrollRegisterService";
import ComplianceCalendarService from "@/services/complianceCalendarService";
import ComplianceAlertService from "@/services/complianceAlertService";
import InternalAuditReportService from "@/services/internalAuditReportService";
import TaxReturnRegisterService from "@/services/taxReturnRegisterService";
import InvoiceRegisterService from "@/services/invoiceRegisterService";

export default function ReportsAudit() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
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
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<
    Array<{ task: string; dueDate: string; priority: string; department: string }>
  >([]);

  const selectedMonth = useMemo(() => {
    const today = new Date();
    if (selectedPeriod === "last-month") {
      today.setMonth(today.getMonth() - 1);
    }
    return today.toISOString().slice(0, 7);
  }, [selectedPeriod]);

  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        const [employees, payroll, deadlines, alerts, audits, taxReturns, invoices] = await Promise.all([
          EmployeeRecordsService.getAll(),
          PayrollRegisterService.getByMonth(selectedMonth),
          ComplianceCalendarService.getAll(),
          ComplianceAlertService.getAll(),
          InternalAuditReportService.getAll(),
          TaxReturnRegisterService.getAll(),
          InvoiceRegisterService.getAll(),
        ]);

        const visibleDeadlines = deadlines.records
          .filter((deadline) => deadline.status !== "completed")
          .slice(0, 6)
          .map((deadline) => ({
            task: deadline.task,
            dueDate: deadline.dueDate,
            priority: deadline.priority,
            department: deadline.department,
          }));

        const monthInvoiceRecords = invoices.records.filter((record) => record.date.startsWith(selectedMonth));
        const totalRevenue = monthInvoiceRecords
          .filter((record) => record.type === "invoice")
          .reduce((sum, record) => sum + Number(record.total || 0), 0);
        const purchaseExpense = monthInvoiceRecords
          .filter((record) => record.type === "receipt")
          .reduce((sum, record) => sum + Number(record.total || 0), 0);
        const totalExpenses = purchaseExpense + payroll.summary.totalGrossPay;

        setDashboardData({
          totalRevenue,
          totalExpenses,
          profit: totalRevenue - totalExpenses,
          activeEmployees: employees.summary.activeEmployees,
          payrollCost: payroll.summary.totalGrossPay,
          unpaidInvoices: invoices.summary.outstandingInvoices,
          upcomingDeadlines: visibleDeadlines.length,
          complianceStatus:
            alerts.summary.active > 3 || deadlines.summary.overdue > 0 || audits.summary.inProgress > 3
              ? "attention"
              : "good",
        });
        setUpcomingDeadlines(visibleDeadlines);
      } catch (error) {
        console.error("Failed to load reports and audit overview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadReportData();
  }, [selectedMonth]);

  const revenueData = [
    { month: "Jan", revenue: dashboardData.totalRevenue * 0.68, expenses: dashboardData.totalExpenses * 0.65 },
    { month: "Feb", revenue: dashboardData.totalRevenue * 0.74, expenses: dashboardData.totalExpenses * 0.7 },
    { month: "Mar", revenue: dashboardData.totalRevenue * 0.78, expenses: dashboardData.totalExpenses * 0.76 },
    { month: "Apr", revenue: dashboardData.totalRevenue * 0.83, expenses: dashboardData.totalExpenses * 0.8 },
    { month: "May", revenue: dashboardData.totalRevenue * 0.9, expenses: dashboardData.totalExpenses * 0.86 },
    { month: "Jun", revenue: dashboardData.totalRevenue, expenses: dashboardData.totalExpenses },
  ];

  const expenseCategories = [
    { name: "Payroll", value: dashboardData.payrollCost, color: "#0f766e" },
    { name: "Tax Filings", value: dashboardData.totalExpenses * 0.22, color: "#f59e0b" },
    { name: "Audit", value: dashboardData.totalExpenses * 0.12, color: "#2563eb" },
    { name: "Compliance", value: dashboardData.totalExpenses * 0.18, color: "#dc2626" },
    { name: "Other", value: dashboardData.totalExpenses * 0.1, color: "#6b7280" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading report overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <ReportsHeader
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="financial-reports">Reports</TabsTrigger>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Analytics</TabsTrigger>
            <TabsTrigger value="audit-logs">Audit Trail</TabsTrigger>
            <TabsTrigger value="system-status">System Status</TabsTrigger>
            <TabsTrigger value="quick-reports">Quick Reports</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          </TabsList>

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
            <UpcomingDeadlines upcomingDeadlines={upcomingDeadlines} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
