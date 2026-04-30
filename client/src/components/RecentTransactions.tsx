import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowDownLeft, ArrowUpRight, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import InvoiceRegisterService from "@/services/invoiceRegisterService";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: string;
  payment_method: string;
  status: string;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadRecentTransactions();
  }, []);

  const loadRecentTransactions = async () => {
    try {
      const { records } = await InvoiceRegisterService.getAll();
      const recent = records
        .slice()
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
        .slice(0, 5)
        .map((record) => ({
          id: record.id,
          type: record.type,
          amount: Number(record.total || record.amount || 0),
          description: record.description || `${record.type} - ${record.party_name}`,
          date: record.date,
          payment_method: record.payment_method || "unassigned",
          status: record.status,
        }));

      setTransactions(recent);
    } catch (error) {
      console.error("Error loading transactions:", error);
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

  const getTransactionIcon = (type: string) =>
    ["invoice", "sale", "income"].includes(type) ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-red-600" />
    );

  const getTransactionColor = (type: string) =>
    ["invoice", "sale", "income"].includes(type) ? "text-green-600" : "text-red-600";

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      unpaid: "bg-orange-100 text-orange-800",
      partially_paid: "bg-amber-100 text-amber-800",
    };

    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/general-ledger"}>
          <Eye className="mr-1 h-4 w-4" />
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Activity className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No recent transactions found</p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.href = "/invoices-receipts"}>
              Create Transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center space-x-4 rounded-lg p-3 transition-colors hover:bg-gray-50">
                <div className="flex-shrink-0">{getTransactionIcon(transaction.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-gray-900">{transaction.description}</p>
                    <Badge className={getStatusBadge(transaction.status)}>{transaction.status}</Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.payment_method.replace("_", " ")}
                    </p>
                    <p className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                      {["invoice", "sale", "income"].includes(transaction.type) ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
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
