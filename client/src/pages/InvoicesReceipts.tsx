import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Eye, FileText, Filter, Plus, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UniversalTransactionForm } from "@/components/forms/UniversalTransactionForm";
import InvoiceRegisterService, {
  InvoiceReceiptRecord,
  InvoiceReceiptSummary,
} from "@/services/invoiceRegisterService";

export default function InvoicesReceipts() {
  const [invoiceReceipts, setInvoiceReceipts] = useState<InvoiceReceiptRecord[]>([]);
  const [summary, setSummary] = useState<InvoiceReceiptSummary>({
    totalInvoices: 0,
    totalReceipts: 0,
    totalSales: 0,
    totalPurchases: 0,
    outstandingInvoices: 0,
    pendingReceipts: 0,
  });
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<InvoiceReceiptRecord | null>(null);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await InvoiceRegisterService.getAll();
      setInvoiceReceipts(response.records || []);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load invoices and receipts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const filteredInvoices = invoiceReceipts.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      query === "" ||
      item.number.toLowerCase().includes(query) ||
      item.party_name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);

    return matchesType && matchesSearch;
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      case "partially_paid":
        return "bg-orange-100 text-orange-700";
      case "cancelled":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const handleExportCSV = () => {
    const headers = ["Number", "Type", "Date", "Party", "TIN", "Amount", "VAT", "Total", "Status", "Tax Category"];
    const rows = filteredInvoices.map((item) => [
      item.number,
      item.type,
      item.date,
      item.party_name,
      item.tin || "",
      item.amount.toString(),
      item.vat.toString(),
      item.total.toString(),
      item.status,
      item.tax_category || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices-receipts-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = (record: InvoiceReceiptRecord) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const lines = [
      ["Document Number", record.number],
      ["Type", record.type === "invoice" ? "Invoice" : "Receipt"],
      ["Party", record.party_name],
      ["TIN", record.tin || "-"],
      ["Date", new Date(record.date).toLocaleDateString()],
      ["Due Date", record.due_date ? new Date(record.due_date).toLocaleDateString() : "-"],
      ["Status", record.status],
      ["Amount", formatCurrency(record.amount)],
      ["VAT", formatCurrency(record.vat)],
      ["Total", formatCurrency(record.total)],
      ["Payment Method", record.payment_method || "-"],
      ["Phone Number", record.phone_number || "-"],
      ["MoMo Reference", record.momo_reference || "-"],
      ["Tax Category", record.tax_category || "-"],
      ["Description", record.description || "-"],
    ] as const;

    doc.setFontSize(18);
    doc.text(record.type === "invoice" ? "Invoice" : "Receipt", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: "center" });

    let y = 42;
    lines.forEach(([label, value]) => {
      doc.setFont(undefined, "bold");
      doc.text(`${label}:`, 16, y);
      doc.setFont(undefined, "normal");
      const wrapped = doc.splitTextToSize(String(value), 120);
      doc.text(wrapped, 70, y);
      y += Math.max(8, wrapped.length * 6);
    });

    doc.save(`${record.number}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading invoices and receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold">Invoices & Receipts Register</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsTransactionFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Transaction
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalSales)}</div>
              <div className="text-sm text-gray-600">Total Sales ({summary.totalInvoices} invoices)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalPurchases)}</div>
              <div className="text-sm text-gray-600">Total Purchases ({summary.totalReceipts} receipts)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{summary.outstandingInvoices}</div>
              <div className="text-sm text-gray-600">Outstanding Invoices</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{filteredInvoices.length}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice & Receipt Register
                <Badge variant="outline" className="ml-2">
                  Linked to Universal Transaction System
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="invoice">Invoices (Sales)</option>
                  <option value="receipt">Receipts (Purchases)</option>
                </select>
                <Input
                  placeholder="Search..."
                  className="max-w-xs"
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No invoices or receipts found. Start by creating a sale or purchase transaction.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.number}</TableCell>
                      <TableCell>
                        <Badge variant={item.type === "invoice" ? "default" : "secondary"}>
                          {item.type === "invoice" ? "Invoice" : "Receipt"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.party_name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.tin || "-"}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.vat)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" title="View Details" onClick={() => setSelectedRecord(item)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Download PDF" onClick={() => handleDownloadPDF(item)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedRecord?.type === "invoice" ? "Invoice Details" : "Receipt Details"}
              </DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Document Number</div>
                    <div className="font-mono font-medium">{selectedRecord.number}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Status</div>
                    <Badge className={getStatusColor(selectedRecord.status)}>{selectedRecord.status}</Badge>
                  </div>
                  <div>
                    <div className="text-gray-500">Party</div>
                    <div className="font-medium">{selectedRecord.party_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">TIN</div>
                    <div className="font-mono">{selectedRecord.tin || "-"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Date</div>
                    <div>{new Date(selectedRecord.date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Due Date</div>
                    <div>{selectedRecord.due_date ? new Date(selectedRecord.due_date).toLocaleDateString() : "-"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Amount</div>
                    <div>{formatCurrency(selectedRecord.amount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">VAT</div>
                    <div>{formatCurrency(selectedRecord.vat)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total</div>
                    <div className="font-semibold">{formatCurrency(selectedRecord.total)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Payment Method</div>
                    <div>{selectedRecord.payment_method || "-"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Phone Number</div>
                    <div>{selectedRecord.phone_number || "-"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">MoMo Reference</div>
                    <div>{selectedRecord.momo_reference || "-"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Tax Category</div>
                    <div>{selectedRecord.tax_category || "-"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Description</div>
                  <div className="rounded border bg-gray-50 p-3 whitespace-pre-wrap">
                    {selectedRecord.description || "-"}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => handleDownloadPDF(selectedRecord)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={() => setSelectedRecord(null)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <UniversalTransactionForm
          open={isTransactionFormOpen}
          onClose={() => setIsTransactionFormOpen(false)}
          onSuccess={() => void refreshData()}
        />
      </div>
    </div>
  );
}
