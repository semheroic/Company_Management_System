import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle, Download, FileText, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AccountingBooksService, { TrialBalanceEntry } from "@/services/accountingBooksService";

export default function TrialBalance() {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadTrialBalance();
  }, [asOfDate]);

  const loadTrialBalance = async () => {
    setIsLoading(true);
    try {
      const balance = await AccountingBooksService.getTrialBalance(undefined, asOfDate);
      setTrialBalance(balance || []);
    } catch (error) {
      console.error("Failed to load report trial balance:", error);
      setTrialBalance([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBalance = useMemo(() => {
    let filtered = trialBalance.filter(
      (entry) => Number(entry.total_debit || 0) > 0 || Number(entry.total_credit || 0) > 0,
    );

    if (accountTypeFilter !== "all") {
      const typePrefix = {
        assets: "1",
        liabilities: "2",
        equity: "3",
        revenue: "4",
        expenses: "5",
      }[accountTypeFilter];

      if (typePrefix) {
        filtered = filtered.filter((entry) => String(entry.code).startsWith(typePrefix));
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) => entry.name.toLowerCase().includes(query) || entry.code.includes(query),
      );
    }

    return filtered;
  }, [accountTypeFilter, searchQuery, trialBalance]);

  const totals = useMemo(
    () =>
      filteredBalance.reduce(
        (acc, entry) => ({
          totalDebits: acc.totalDebits + Number(entry.total_debit || 0),
          totalCredits: acc.totalCredits + Number(entry.total_credit || 0),
        }),
        { totalDebits: 0, totalCredits: 0 },
      ),
    [filteredBalance],
  );

  const isBalanced = Math.abs(totals.totalDebits - totals.totalCredits) < 0.01;

  const exportTrialBalance = () => {
    const csvContent = [
      "Account Code,Account Name,Debit,Credit,Balance",
      ...filteredBalance.map((entry) =>
        [
          entry.code,
          `"${entry.name}"`,
          Number(entry.total_debit || 0).toFixed(2),
          Number(entry.total_credit || 0).toFixed(2),
          Number(entry.net_balance || 0).toFixed(2),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trial-balance-${asOfDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trial Balance
          </CardTitle>
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Balanced
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Out of Balance
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={exportTrialBalance}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60"
            />
          </div>

          <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="assets">Assets (1xxx)</SelectItem>
              <SelectItem value="liabilities">Liabilities (2xxx)</SelectItem>
              <SelectItem value="equity">Equity (3xxx)</SelectItem>
              <SelectItem value="revenue">Revenue (4xxx)</SelectItem>
              <SelectItem value="expenses">Expenses (5xxx)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading trial balance...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalDebits)}</div>
                    <div className="text-sm text-gray-600">Total Debits</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.totalCredits)}</div>
                    <div className="text-sm text-gray-600">Total Credits</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(Math.abs(totals.totalDebits - totals.totalCredits))}
                    </div>
                    <div className="text-sm text-gray-600">Difference</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Account Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Account Name</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Debit</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Credit</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBalance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No accounts found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredBalance.map((entry) => {
                      const debit = Number(entry.total_debit || 0);
                      const credit = Number(entry.total_credit || 0);
                      const balance = Number(entry.net_balance || 0);

                      return (
                        <tr key={entry.code} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono">{entry.code}</td>
                          <td className="px-4 py-3 text-sm">{entry.name}</td>
                          <td className="px-4 py-3 text-right text-sm font-mono">
                            {debit > 0 ? formatCurrency(debit) : "-"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono">
                            {credit > 0 ? formatCurrency(credit) : "-"}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-sm font-mono ${
                              balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : "text-gray-600"
                            }`}
                          >
                            {balance !== 0 ? formatCurrency(balance) : "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="border-t-2 border-gray-900 bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right font-semibold">
                      Totals
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(totals.totalDebits)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(totals.totalCredits)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {isBalanced ? "Balanced" : formatCurrency(Math.abs(totals.totalDebits - totals.totalCredits))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
