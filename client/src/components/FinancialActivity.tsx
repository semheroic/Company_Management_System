import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Eye, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import InvoiceRegisterService from "@/services/invoiceRegisterService";

export function FinancialActivity() {
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    monthlyGrowth: 0,
    cashFlow: 0,
    pendingInvoices: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const { records, summary } = await InvoiceRegisterService.getAll();
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      const isWithinRange = (value: string, start: Date, end: Date) => {
        const date = new Date(value);
        return date >= start && date <= end;
      };

      const currentMonthRecords = records.filter((record) => isWithinRange(record.date, firstDayOfMonth, lastDayOfMonth));
      const revenue = currentMonthRecords
        .filter((record) => record.type === "invoice")
        .reduce((sum, record) => sum + Number(record.total || 0), 0);
      const expenses = currentMonthRecords
        .filter((record) => record.type === "receipt")
        .reduce((sum, record) => sum + Number(record.total || 0), 0);
      const previousRevenue = records
        .filter((record) => record.type === "invoice" && isWithinRange(record.date, previousMonthStart, previousMonthEnd))
        .reduce((sum, record) => sum + Number(record.total || 0), 0);

      const netProfit = revenue - expenses;
      const monthlyGrowth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

      setFinancialData({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit,
        monthlyGrowth,
        cashFlow: summary.totalSales - summary.totalPurchases,
        pendingInvoices: summary.outstandingInvoices,
      });
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Financial Activity</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Financial Activity</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(financialData.netProfit)}</div>
            <p className="text-xs text-muted-foreground">Net Profit (This Month)</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="font-medium text-green-600">{formatCurrency(financialData.totalRevenue)}</div>
              <div className="text-xs text-muted-foreground">Revenue</div>
            </div>
            <div>
              <div className="font-medium text-red-600">{formatCurrency(financialData.totalExpenses)}</div>
              <div className="text-xs text-muted-foreground">Expenses</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Cash Flow:</span>
              <span className={`font-medium ${financialData.cashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(financialData.cashFlow)}
              </span>
            </div>

            {financialData.pendingInvoices > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Pending Invoices:</span>
                <span className="text-orange-600">{financialData.pendingInvoices}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs">
              {financialData.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={financialData.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(financialData.monthlyGrowth).toFixed(1)}% vs last month
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/reports-audit"}>
              <Eye className="mr-1 h-3 w-3" />
              View Reports
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
