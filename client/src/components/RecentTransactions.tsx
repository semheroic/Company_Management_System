import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowDownLeft, ArrowUpRight, Eye, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AccountingBooksService from "@/services/accountingBooksService";

interface RecentJournal {
  id: number;
  journalId: number;
  reference: string;
  description: string;
  date: string;
  sourceType: string;
  status: string;
  amount: number;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<RecentJournal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadRecentTransactions();
  }, []);

  const loadRecentTransactions = async () => {
    try {
      const { entries } = await AccountingBooksService.getAccountingBooks();
      const journals = new Map<number, RecentJournal>();

      for (const entry of entries) {
        if (journals.has(entry.journal_entry_id)) {
          const current = journals.get(entry.journal_entry_id)!;
          current.amount += Number(entry.debit || 0);
          continue;
        }

        journals.set(entry.journal_entry_id, {
          id: entry.id,
          journalId: entry.journal_entry_id,
          reference: entry.reference,
          description: entry.description,
          date: entry.date,
          sourceType: entry.source_type,
          status: entry.status,
          amount: Number(entry.debit || 0),
        });
      }

      setTransactions(Array.from(journals.values()).slice(0, 5));
    } catch (error) {
      console.error("Error loading recent transactions:", error);
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

  const isInflow = (sourceType: string) => ["sale", "invoice", "income", "capital_contribution", "share_issuance"].includes(sourceType);

  const getTransactionIcon = (sourceType: string) =>
    isInflow(sourceType) ? (
      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-rose-600" />
    );

  const getTransactionColor = (sourceType: string) => (isInflow(sourceType) ? "text-emerald-600" : "text-rose-600");
  const formatSourceTypeLabel = (sourceType: string) =>
    sourceType
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      posted: "bg-emerald-100 text-emerald-800",
      confirmed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-rose-100 text-rose-800",
      reversal: "bg-sky-100 text-sky-800",
      unpaid: "bg-amber-100 text-amber-800",
      partially_paid: "bg-orange-100 text-orange-800",
    };

    return colors[status] || "bg-slate-100 text-slate-700";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex animate-pulse items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                </div>
                <div className="h-6 w-20 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link to="/accounting-books">
            <Eye className="mr-1 h-4 w-4" />
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <ReceiptText className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No posted transactions found</p>
            <Button variant="outline" className="mt-3" asChild>
              <Link to="/accounting-books">Open Accounting Books</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.journalId}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-start"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  {getTransactionIcon(transaction.sourceType)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{transaction.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(transaction.date).toLocaleDateString()} • {transaction.reference} • {formatSourceTypeLabel(transaction.sourceType)}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(transaction.status)}>{transaction.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-500">Journal #{transaction.journalId}</span>
                    <span className={`text-sm font-semibold ${getTransactionColor(transaction.sourceType)}`}>
                      {isInflow(transaction.sourceType) ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
