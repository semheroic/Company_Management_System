import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, Eye, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AccountingBooksService from "@/services/accountingBooksService";
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
      const [booksResponse, trialBalance, invoiceRegister] = await Promise.all([
        AccountingBooksService.getAccountingBooks(),
        AccountingBooksService.getTrialBalance(),
        InvoiceRegisterService.getAll(),
      ]);

      const currentDate = new Date();
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      const isWithinRange = (value: string, start: Date, end: Date) => {
        const date = new Date(value);
        return date >= start && date <= end;
      };

      const currentMonthRevenue = booksResponse.entries
        .filter((entry) => entry.account_code.startsWith("4") && isWithinRange(entry.date, currentMonthStart, currentMonthEnd))
        .reduce((sum, entry) => sum + Number(entry.credit || 0), 0);

      const currentMonthExpenses = booksResponse.entries
        .filter((entry) => entry.account_code.startsWith("5") && isWithinRange(entry.date, currentMonthStart, currentMonthEnd))
        .reduce((sum, entry) => sum + Number(entry.debit || 0), 0);

      const previousMonthRevenue = booksResponse.entries
        .filter((entry) => entry.account_code.startsWith("4") && isWithinRange(entry.date, previousMonthStart, previousMonthEnd))
        .reduce((sum, entry) => sum + Number(entry.credit || 0), 0);

      const cashFlow = trialBalance
        .filter((entry) => String(entry.code).startsWith("100"))
        .reduce((sum, entry) => sum + Number(entry.net_balance || 0), 0);

      const netProfit = currentMonthRevenue - currentMonthExpenses;
      const monthlyGrowth =
        previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

      setFinancialData({
        totalRevenue: currentMonthRevenue,
        totalExpenses: currentMonthExpenses,
        netProfit,
        monthlyGrowth,
        cashFlow,
        pendingInvoices: invoiceRegister.summary.outstandingInvoices,
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
    <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Financial Activity</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(financialData.netProfit)}</div>
            <p className="text-xs text-muted-foreground">Net Profit (This Month)</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-emerald-50 p-3">
              <div className="font-medium text-emerald-700">{formatCurrency(financialData.totalRevenue)}</div>
              <div className="text-xs text-emerald-900/70">Revenue</div>
            </div>
            <div className="rounded-xl bg-rose-50 p-3">
              <div className="font-medium text-rose-700">{formatCurrency(financialData.totalExpenses)}</div>
              <div className="text-xs text-rose-900/70">Expenses</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Cash position</span>
              <span className={`font-medium ${financialData.cashFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(financialData.cashFlow)}
              </span>
            </div>

            {financialData.pendingInvoices > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Outstanding invoices</span>
                <span className="text-amber-600">{financialData.pendingInvoices}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 text-xs">
              {financialData.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-600" />
              )}
              <span className={financialData.monthlyGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {Math.abs(financialData.monthlyGrowth).toFixed(1)}% vs last month
              </span>
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link to="/reports-audit">
                <Eye className="mr-1 h-3 w-3" />
                View Reports
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
