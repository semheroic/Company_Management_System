import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Eye, FileText, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/services/companyApi";
import AccountingBooksService, {
  AccountingBookEntry,
  TrialBalanceEntry,
} from "@/services/accountingBooksService";

export default function GeneralLedger() {
  const { toast } = useToast();
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterSourceType, setFilterSourceType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [generalLedger, setGeneralLedger] = useState<AccountingBookEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);

  useEffect(() => {
    void refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [booksResponse, trialBalanceResponse] = await Promise.all([
        AccountingBooksService.getAccountingBooks(),
        AccountingBooksService.getTrialBalance(),
      ]);

      setGeneralLedger(booksResponse.entries || []);
      setTrialBalance(trialBalanceResponse || []);
    } catch (error: any) {
      console.error("Failed to load general ledger:", error);
      toast({
        title: "Load Failed",
        description: error.response?.data?.error || "Could not load general ledger data from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return generalLedger.filter((entry) => {
      const matchesAccount = filterAccount === "all" || entry.account_code === filterAccount;
      const matchesSourceType = filterSourceType === "all" || entry.source_type === filterSourceType;
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        query === "" ||
        entry.reference.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        entry.account_name.toLowerCase().includes(query);

      return matchesAccount && matchesSourceType && matchesSearch;
    });
  }, [filterAccount, filterSourceType, generalLedger, searchTerm]);

  const accountOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const entry of generalLedger) {
      if (!seen.has(entry.account_code)) {
        seen.set(entry.account_code, entry.account_name);
      }
    }
    return Array.from(seen.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [generalLedger]);

  const financialSummary = useMemo(() => {
    const revenue = trialBalance
      .filter((entry) => String(entry.code).startsWith("4"))
      .reduce((sum, entry) => sum + Number(entry.total_credit || 0), 0);

    const expenses = trialBalance
      .filter((entry) => String(entry.code).startsWith("5"))
      .reduce((sum, entry) => sum + Number(entry.total_debit || 0), 0);

    const assets = trialBalance
      .filter((entry) => String(entry.code).startsWith("1"))
      .reduce((sum, entry) => sum + Number(entry.net_balance || 0), 0);

    const liabilities = trialBalance
      .filter((entry) => String(entry.code).startsWith("2"))
      .reduce((sum, entry) => sum + Math.abs(Number(entry.net_balance || 0)), 0);

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      assets,
      liabilities,
      equity: assets - liabilities,
    };
  }, [trialBalance]);

  const handleExport = (format: "csv" | "pdf") => {
    if (format === "csv") {
      const headers = ["Date", "Reference", "Account Code", "Account Name", "Description", "Debit", "Credit", "Source"];
      const csvData = [
        headers.join(","),
        ...filteredEntries.map((entry) =>
          [
            entry.date,
            `"${entry.reference}"`,
            entry.account_code,
            `"${entry.account_name}"`,
            `"${entry.description}"`,
            entry.debit.toFixed(2),
            entry.credit.toFixed(2),
            entry.source_type,
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `general-ledger-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Started",
        description: "General ledger exported as CSV.",
      });
      return;
    }

    toast({
      title: "PDF Export Not Ready",
      description: "PDF export is not implemented yet. Use CSV for now.",
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount);

  const getSourceTypeBadgeColor = (sourceType: string) => {
    switch (sourceType) {
      case "invoice":
      case "sale":
      case "income":
        return "bg-green-100 text-green-800";
      case "purchase":
        return "bg-blue-100 text-blue-800";
      case "payroll":
      case "salary":
        return "bg-purple-100 text-purple-800";
      case "asset":
      case "asset_acquisition":
        return "bg-yellow-100 text-yellow-800";
      case "payment":
      case "expense":
        return "bg-orange-100 text-orange-800";
      case "capital_contribution":
      case "share_issuance":
        return "bg-indigo-100 text-indigo-800";
      case "capital_withdrawal":
      case "dividend_payment":
        return "bg-rose-100 text-rose-800";
      case "dividend_declaration":
      case "equity_adjustment":
      case "transfer":
        return "bg-sky-100 text-sky-800";
      case "manual":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatSourceTypeLabel = (sourceType: string) =>
    sourceType
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const handleViewDocument = (entry: AccountingBookEntry) => {
    if (!entry.document_file_path) {
      toast({
        title: "No Attachment",
        description: `Journal ${entry.reference} has no supporting document attached.`,
      });
      return;
    }

    window.open(`${API_BASE}/${entry.document_file_path}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading general ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-copy">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">General Ledger</h1>
              <p className="mt-1 text-sm text-slate-600">
                Review line-level ledger postings, account movement, and financial position from the synchronized backend books.
              </p>
            </div>
          </div>
          <div className="page-actions">
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="page-metrics">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.revenue)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.expenses)}</div>
              <div className="text-sm text-gray-600">Total Expenses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(financialSummary.profit)}</div>
              <div className="text-sm text-gray-600">Net Profit</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{generalLedger.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </CardContent>
          </Card>
        </div>

        <Card className="page-card">
          <CardHeader>
            <div className="page-toolbar">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                General Ledger Entries
              </CardTitle>
              <div className="page-toolbar-controls">
                <Select value={filterAccount} onValueChange={setFilterAccount}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Filter by account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accountOptions.map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSourceType} onValueChange={setFilterSourceType}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="capital_contribution">Capital Contribution</SelectItem>
                    <SelectItem value="capital_withdrawal">Capital Withdrawal</SelectItem>
                    <SelectItem value="share_issuance">Share Issuance</SelectItem>
                    <SelectItem value="dividend_declaration">Dividend Declaration</SelectItem>
                    <SelectItem value="dividend_payment">Dividend Payment</SelectItem>
                    <SelectItem value="equity_adjustment">Equity Adjustment</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search entries..."
                  className="w-full sm:w-72"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={() => void refreshData()}>
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="table-scroll">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit (RWF)</TableHead>
                  <TableHead className="text-right">Credit (RWF)</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell className="font-mono">{entry.reference}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.account_code}</div>
                        <div className="text-sm text-gray-600">{entry.account_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getSourceTypeBadgeColor(entry.source_type)}>{formatSourceTypeLabel(entry.source_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewDocument(entry)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {filteredEntries.length === 0 && (
              <div className="text-center py-8 text-gray-500">No entries found matching your criteria</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
