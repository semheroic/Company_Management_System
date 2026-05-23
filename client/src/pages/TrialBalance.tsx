import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Download, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AccountingBooksService, { TrialBalanceEntry } from "@/services/accountingBooksService";

export default function TrialBalance() {
  const { toast } = useToast();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadTrialBalance(asOfDate);
  }, [asOfDate]);

  const loadTrialBalance = async (targetDate: string) => {
    setIsLoading(true);
    try {
      const response = await AccountingBooksService.getTrialBalance(undefined, targetDate);
      setTrialBalance(response || []);
    } catch (error: any) {
      console.error("Failed to load trial balance:", error);
      toast({
        title: "Load Failed",
        description: error.response?.data?.error || "Could not load trial balance from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const visibleRows = useMemo(
    () => trialBalance.filter((account) => Number(account.total_debit || 0) > 0 || Number(account.total_credit || 0) > 0),
    [trialBalance],
  );

  const financialSummary = useMemo(() => {
    const assets = visibleRows
      .filter((entry) => String(entry.code).startsWith("1"))
      .reduce((sum, entry) => sum + Number(entry.net_balance || 0), 0);

    const liabilities = visibleRows
      .filter((entry) => String(entry.code).startsWith("2"))
      .reduce((sum, entry) => sum + Math.abs(Number(entry.net_balance || 0)), 0);

    const equity = visibleRows
      .filter((entry) => String(entry.code).startsWith("3"))
      .reduce((sum, entry) => sum + Math.abs(Number(entry.net_balance || 0)), 0);

    const revenue = visibleRows
      .filter((entry) => String(entry.code).startsWith("4"))
      .reduce((sum, entry) => sum + Number(entry.total_credit || 0), 0);

    const expenses = visibleRows
      .filter((entry) => String(entry.code).startsWith("5"))
      .reduce((sum, entry) => sum + Number(entry.total_debit || 0), 0);

    return {
      assets,
      liabilities,
      equity,
      profit: revenue - expenses,
    };
  }, [visibleRows]);

  const totalDebits = visibleRows.reduce((sum, account) => sum + Number(account.total_debit || 0), 0);
  const totalCredits = visibleRows.reduce((sum, account) => sum + Number(account.total_credit || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleExport = () => {
    const csvContent = [
      "Account Code,Account Name,Debit,Credit,Balance",
      ...visibleRows.map((account) =>
        [
          account.code,
          `"${account.name}"`,
          Number(account.total_debit || 0).toFixed(2),
          Number(account.total_credit || 0).toFixed(2),
          Number(account.net_balance || 0).toFixed(2),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trial-balance-${asOfDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount);

  const getAccountTypeColor = (accountCode: string) => {
    if (accountCode.startsWith("1")) return "text-blue-700";
    if (accountCode.startsWith("2")) return "text-red-700";
    if (accountCode.startsWith("3")) return "text-purple-700";
    if (accountCode.startsWith("4")) return "text-green-700";
    if (accountCode.startsWith("5")) return "text-orange-700";
    return "text-gray-700";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading trial balance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold">Trial Balance</h1>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-gray-600" />
              <label htmlFor="asOfDate" className="font-medium">
                As of Date:
              </label>
              <Input
                id="asOfDate"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-48"
              />
              <div
                className={`ml-4 rounded-full px-3 py-1 text-sm font-medium ${
                  isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {isBalanced ? "Balanced" : "Out of Balance"}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(financialSummary.assets)}</div>
              <div className="text-sm text-gray-600">Total Assets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.liabilities)}</div>
              <div className="text-sm text-gray-600">Total Liabilities</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(financialSummary.equity)}</div>
              <div className="text-sm text-gray-600">Total Equity</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.profit)}</div>
              <div className="text-sm text-gray-600">Net Profit</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Trial Balance as of {asOfDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right">Debit (RWF)</TableHead>
                  <TableHead className="text-right">Credit (RWF)</TableHead>
                  <TableHead className="text-right">Balance (RWF)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((account) => {
                  const debit = Number(account.total_debit || 0);
                  const credit = Number(account.total_credit || 0);
                  const balance = Number(account.net_balance || 0);

                  return (
                    <TableRow key={account.code}>
                      <TableCell className={`font-mono font-medium ${getAccountTypeColor(account.code)}`}>
                        {account.code}
                      </TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="text-right">{debit > 0 ? formatCurrency(debit) : "-"}</TableCell>
                      <TableCell className="text-right">{credit > 0 ? formatCurrency(credit) : "-"}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          balance > 0 ? "text-blue-600" : balance < 0 ? "text-red-600" : ""
                        }`}
                      >
                        {balance !== 0 ? formatCurrency(Math.abs(balance)) : "-"}
                        {balance < 0 ? " (CR)" : ""}
                      </TableCell>
                    </TableRow>
                  );
                })}

                <TableRow className="border-t-2 bg-gray-50 font-bold">
                  <TableCell colSpan={2} className="text-right">
                    TOTALS
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(totalDebits)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCredits)}</TableCell>
                  <TableCell className="text-right">
                    {isBalanced ? "Balanced" : `Difference: ${formatCurrency(Math.abs(totalDebits - totalCredits))}`}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {visibleRows.length === 0 && (
              <div className="py-8 text-center text-gray-500">No account balances found for the selected date.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
