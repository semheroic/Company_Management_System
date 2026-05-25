import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, DollarSign, Download, Loader2, TrendingUp } from "lucide-react";
import AccountingBooksService, {
  type IncomeBreakdownEntry,
  type IncomeBreakdownSummary,
} from "@/services/accountingBooksService";

const emptySummary = (fromDate: string, toDate: string): IncomeBreakdownSummary => ({
  totalAmount: 0,
  operatingIncome: 0,
  nonOperatingIncome: 0,
  transactionCount: 0,
  fromDate,
  toDate,
});

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658"];

export default function IncomeBreakdown() {
  const [incomeData, setIncomeData] = useState<IncomeBreakdownEntry[]>([]);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState<IncomeBreakdownSummary>(() => emptySummary(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    new Date().toISOString().split("T")[0],
  ));
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadIncomeBreakdown = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await AccountingBooksService.getIncomeBreakdown(fromDate, toDate);
        if (!isActive) {
          return;
        }

        setIncomeData(response.records || []);
        setSummary(response.summary || emptySummary(fromDate, toDate));
      } catch (error: any) {
        if (!isActive) {
          return;
        }

        setIncomeData([]);
        setSummary(emptySummary(fromDate, toDate));
        setErrorMessage(error?.response?.data?.error || "Could not load income analysis from the backend.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadIncomeBreakdown();

    return () => {
      isActive = false;
    };
  }, [fromDate, toDate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount);

  const exportBreakdown = () => {
    const csvContent = [
      "Income Source,Amount (RWF),Percentage,Count",
      ...incomeData.map((item) =>
        [item.label, item.amount.toFixed(2), `${item.percentage.toFixed(1)}%`, item.count].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `income-breakdown-${fromDate}-to-${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Income Source Breakdown
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportBreakdown} disabled={incomeData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-40" />
            </div>
            <span className="text-gray-500">to</span>
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-40" />
          </div>
          <div className="text-xs text-gray-500">
            Backend range: {summary.fromDate} to {summary.toDate}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex min-h-[20rem] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading income analysis...
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalAmount)}</div>
                    <div className="text-sm text-gray-600">Total Income</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.operatingIncome)}</div>
                    <div className="text-sm text-gray-600">Operating Income</div>
                    <div className="text-xs text-gray-500">
                      {summary.totalAmount > 0 ? ((summary.operatingIncome / summary.totalAmount) * 100).toFixed(1) : 0}% of total
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.nonOperatingIncome)}</div>
                    <div className="text-sm text-gray-600">Non-Operating Income</div>
                    <div className="text-xs text-gray-500">
                      {summary.totalAmount > 0 ? ((summary.nonOperatingIncome / summary.totalAmount) * 100).toFixed(1) : 0}% of total
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {incomeData.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                No income transactions were found for the selected backend date range.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Income Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={incomeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ label, percentage }) => `${label}: ${Number(percentage).toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {incomeData.map((entry, index) => (
                              <Cell key={entry.source} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Income by Source</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incomeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} fontSize={12} />
                          <YAxis tickFormatter={(value) => `${(Number(value) / 1000000).toFixed(1)}M`} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="amount" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detailed Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Income Source</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Amount</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Percentage</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Count</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {incomeData.map((item) => (
                            <tr key={item.source} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium">{item.label}</td>
                              <td className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(item.amount)}</td>
                              <td className="px-4 py-3 text-right text-sm">{item.percentage.toFixed(1)}%</td>
                              <td className="px-4 py-3 text-right text-sm">{item.count}</td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={item.source === "sales" ? "default" : "secondary"}>
                                  {item.source === "sales" ? "Operating" : "Non-Operating"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
                  <DollarSign className="h-5 w-5" />
                  Legal & Tax Compliance Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-amber-700">
                <p><strong>Operating vs Non-Operating:</strong> The distinction matters for presentation under IAS 1 and internal management reporting.</p>
                <p><strong>Loans:</strong> Loan proceeds should be recorded as liabilities, not revenue.</p>
                <p><strong>Gifts and Donations:</strong> Review tax treatment and supporting documentation before treating them as unrestricted income.</p>
                <p><strong>Grants:</strong> Grants often carry reporting obligations and usage restrictions.</p>
                <p><strong>Sales:</strong> Sales-backed income should still follow invoicing and VAT rules where applicable.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
