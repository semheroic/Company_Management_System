import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Calculator,
  Download,
  Eye,
  Filter,
  Loader2,
  Plus,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AccountingEntryForm } from "@/components/forms/AccountingEntryForm";
import { UniversalTransactionForm } from "@/components/forms/UniversalTransactionForm";
import IncomeBreakdown from "@/components/reports/IncomeBreakdown";
import { API_BASE } from "@/services/companyApi";
import AccountingBooksService, {
  AccountingBookEntry,
  AccountingBookSummary,
} from "@/services/accountingBooksService";
import UniversalTransactionService from "@/services/universalTransactionService";

export default function AccountingBooks() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showUniversalForm, setShowUniversalForm] = useState(false);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingJournalId, setCancellingJournalId] = useState<number | null>(null);
  const [generalLedger, setGeneralLedger] = useState<AccountingBookEntry[]>([]);
  const [summary, setSummary] = useState<AccountingBookSummary>({
    journalCount: 0,
    lineCount: 0,
    totalDebits: 0,
    totalCredits: 0,
    netBalance: 0,
  });

  useEffect(() => {
    void refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);

    try {
      const response = await AccountingBooksService.getAccountingBooks();
      setGeneralLedger(response.entries || []);
      setSummary(response.summary);
    } catch (error: any) {
      console.error("Failed to load accounting books:", error);
      toast({
        title: "Load Failed",
        description: error.response?.data?.error || "Could not load accounting books from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntries = generalLedger.filter((entry) => {
    const matchesType = filterType === "all" || entry.source_type === filterType;
    const matchesSearch =
      searchTerm === "" ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateFrom = !dateFrom || entry.date >= dateFrom;
    const matchesDateTo = !dateTo || entry.date <= dateTo;

    return matchesType && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const handleRefresh = async () => {
    await refreshData();
    toast({
      title: "Data Refreshed",
      description: "Accounting data has been updated successfully.",
    });
  };

  const handleExport = (format: "csv" | "excel") => {
    const headers = ["Date", "Reference", "Account Code", "Account Name", "Description", "Source Type", "Debit", "Credit"];
    const csvData = [
      headers.join(","),
      ...filteredEntries.map((entry) =>
        [
          entry.date,
          `"${entry.reference}"`,
          entry.account_code,
          `"${entry.account_name}"`,
          `"${entry.description}"`,
          entry.source_type,
          entry.debit.toFixed(2),
          entry.credit.toFixed(2),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `accounting-books-${new Date().toISOString().split("T")[0]}.${format === "excel" ? "csv" : "csv"}`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Accounting books exported as ${format.toUpperCase()} file.`,
    });
  };

  const handleSuccess = async () => {
    setShowUniversalForm(false);
    await handleRefresh();
  };

  const handleCancelJournal = async (entry: AccountingBookEntry) => {
    if (entry.status === "cancelled" || entry.source_type === "reversal") {
      return;
    }

    const reason = window.prompt(
      `Cancel journal ${entry.reference}? This will post an automatic reversal entry.\n\nEnter a reason:`,
      "Cancelled by user",
    );

    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast({
        title: "Reason Required",
        description: "Enter a reason before cancelling a journal entry.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCancellingJournalId(entry.journal_entry_id);
      const response = await AccountingBooksService.cancelJournalEntry(entry.journal_entry_id, trimmedReason);

      if (response?.sourceId) {
        UniversalTransactionService.updateTransactionStatus(response.sourceId, "cancelled");
      }

      await refreshData();
      toast({
        title: "Journal Cancelled",
        description: `Journal ${entry.reference} was reversed successfully.`,
      });
    } catch (error: any) {
      console.error("Failed to cancel journal:", error);
      toast({
        title: "Cancellation Failed",
        description: error.response?.data?.error || "Could not cancel this journal entry.",
        variant: "destructive",
      });
    } finally {
      setCancellingJournalId(null);
    }
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

  const getJournalStatusBadgeColor = (entry: AccountingBookEntry) => {
    if (entry.source_type === "reversal") {
      return "bg-blue-100 text-blue-800";
    }

    if (entry.status === "cancelled") {
      return "bg-red-100 text-red-800";
    }

    return "bg-slate-100 text-slate-700";
  };

  const getJournalStatusLabel = (entry: AccountingBookEntry) => {
    if (entry.source_type === "reversal") {
      return "Reversal";
    }

    return entry.status === "cancelled" ? "Cancelled" : "Posted";
  };

  const filteredDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const filteredCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);

  const handleViewEntry = (entry: AccountingBookEntry) => {
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
          <p className="text-sm text-gray-600">Loading accounting books...</p>
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
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Accounting Books</h1>
              <p className="mt-1 text-sm text-slate-600">
                Post journals, review ledger activity, and monitor the backend accounting record for the active company.
              </p>
            </div>
          </div>
          <div className="page-actions">
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
            <Button onClick={() => setShowUniversalForm(true)} className="bg-green-600 hover:bg-green-700">
              <Zap className="w-4 h-4 mr-2" />
              Quick Transaction
            </Button>
          </div>
        </div>

        <Card className="page-card border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Universal Transaction System</h3>
                  <p className="text-sm text-slate-600">
                    Use Quick Transaction for single-entry bookkeeping. It now syncs the backend accounting books while preserving the existing local transaction workflows.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:shrink-0">
                <Button
                  onClick={() => setShowUniversalForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Open Transaction Entry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowIncomeBreakdown(true)}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Income Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="page-metrics">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalDebits)}</div>
              <div className="text-sm text-gray-600">Total Debits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalCredits)}</div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(Math.abs(summary.netBalance))}
              </div>
              <div className="text-sm text-gray-600">Net Balance</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.lineCount}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </CardContent>
          </Card>
        </div>

        <Card className="page-card">
          <CardHeader>
            <div className="page-toolbar">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Accounting Entries
              </CardTitle>
              <div className="page-toolbar-controls">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-40"
                  placeholder="From Date"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-40"
                  placeholder="To Date"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="invoice">Sales</SelectItem>
                    <SelectItem value="purchase">Purchases</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="asset">Assets</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
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
                  className="w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="table-scroll">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Debit (RWF)</TableHead>
                    <TableHead className="text-right">Credit (RWF)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry, index) => {
                      const isPrimaryJournalRow =
                        filteredEntries.findIndex((candidate) => candidate.journal_entry_id === entry.journal_entry_id) === index;

                      return (
                      <TableRow key={entry.id} className="hover:bg-gray-50">
                        <TableCell>{entry.date}</TableCell>
                        <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.account_code}</div>
                            <div className="text-sm text-gray-600">{entry.account_name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                        <TableCell>
                          <Badge className={getSourceTypeBadgeColor(entry.source_type)}>{formatSourceTypeLabel(entry.source_type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={getJournalStatusBadgeColor(entry)}>{getJournalStatusLabel(entry)}</Badge>
                            {entry.status === "cancelled" && entry.reversal_reference && (
                              <div className="text-xs text-gray-500">Reversed by {entry.reversal_reference}</div>
                            )}
                            {entry.status === "cancelled" && entry.cancelled_reason && (
                              <div className="max-w-xs truncate text-xs text-gray-500" title={entry.cancelled_reason}>
                                {entry.cancelled_reason}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" title="View Details" onClick={() => handleViewEntry(entry)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isPrimaryJournalRow && entry.source_type !== "reversal" && entry.status !== "cancelled" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Cancel Journal"
                                disabled={cancellingJournalId === entry.journal_entry_id}
                                onClick={() => void handleCancelJournal(entry)}
                              >
                                {cancellingJournalId === entry.journal_entry_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Ban className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        {searchTerm || filterType !== "all" || dateFrom || dateTo
                          ? "No entries found matching your criteria"
                          : "No accounting entries found. Use Quick Transaction or Manual Entry to add your first journal."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredEntries.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
                  <div>
                    <div className="text-lg font-semibold text-green-600">{formatCurrency(filteredDebits)}</div>
                    <div className="text-sm text-gray-600">Filtered Debits</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(filteredCredits)}</div>
                    <div className="text-sm text-gray-600">Filtered Credits</div>
                  </div>
                  <div>
                    <div className={`text-lg font-semibold ${Math.abs(filteredDebits - filteredCredits) < 0.01 ? "text-green-600" : "text-orange-600"}`}>
                      {Math.abs(filteredDebits - filteredCredits) < 0.01
                        ? "Balanced"
                        : formatCurrency(Math.abs(filteredDebits - filteredCredits))}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Math.abs(filteredDebits - filteredCredits) < 0.01 ? "Books are balanced" : "Difference"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <AccountingEntryForm open={showForm} onClose={() => setShowForm(false)} onSuccess={handleRefresh} />
        <UniversalTransactionForm
          open={showUniversalForm}
          onClose={() => setShowUniversalForm(false)}
          onSuccess={handleSuccess}
        />

        {showIncomeBreakdown && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold">Income Source Analysis</h2>
                <Button variant="ghost" onClick={() => setShowIncomeBreakdown(false)}>
                  Close
                </Button>
              </div>
              <div className="p-4">
                <IncomeBreakdown />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
