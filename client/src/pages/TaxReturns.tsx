import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  Plus,
  Receipt,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaxReturnForm } from "@/components/forms/TaxReturnForm";
import { QITForm } from "@/components/forms/QITForm";
import TaxService from "@/services/taxService";
import TaxReturnRegisterService, {
  TaxReturnRecord,
  TaxReturnSummary,
} from "@/services/taxReturnRegisterService";
import { useToast } from "@/hooks/use-toast";

export default function TaxReturns() {
  const { toast } = useToast();
  const [showTaxReturnForm, setShowTaxReturnForm] = useState(false);
  const [showQITForm, setShowQITForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<TaxReturnRecord | null>(null);
  const [returns, setReturns] = useState<TaxReturnRecord[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [registerSummary, setRegisterSummary] = useState<TaxReturnSummary>({
    totalReturns: 0,
    filedReturns: 0,
    pendingReturns: 0,
    overdueReturns: 0,
    totalDeclared: 0,
  });
  const [taxSummary, setTaxSummary] = useState(TaxService.getTaxSummary());

  const loadTaxReturns = async () => {
    setIsLoading(true);
    try {
      const response = await TaxReturnRegisterService.getAll();
      setReturns(response.records || []);
      setRegisterSummary(response.summary);
    } catch (error) {
      console.error("Failed to load tax returns:", error);
      toast({
        title: "Load Failed",
        description: "Could not load tax returns from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTaxSummary(TaxService.getTaxSummary());
    void loadTaxReturns();
  }, []);

  const filteredReturns = returns.filter((returnItem) => {
    const query = searchTerm.toLowerCase();
    const matchesType = filterType === "all" || returnItem.taxType.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch =
      returnItem.taxType.toLowerCase().includes(query) || returnItem.period.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });

  const getLatestReturn = (type: string) => returns.find((record) => record.taxType === type);
  const latestVAT = getLatestReturn("VAT");
  const latestPAYE = getLatestReturn("PAYE");
  const latestCIT = getLatestReturn("CIT");
  const latestQIT = getLatestReturn("QIT");

  const dashboardSummary = {
    vat_due: latestVAT && latestVAT.status !== "Filed" ? latestVAT.totalDeclared : taxSummary.vat_due,
    paye_due: latestPAYE && latestPAYE.status !== "Filed" ? latestPAYE.totalDeclared : taxSummary.paye_due,
    cit_due: latestCIT && latestCIT.status !== "Filed" ? latestCIT.totalDeclared : taxSummary.cit_due,
    qit_due: latestQIT && latestQIT.status !== "Filed" ? latestQIT.totalDeclared : taxSummary.qit_due,
    next_filing_dates: {
      vat: latestVAT?.dueDate || taxSummary.next_filing_dates.vat,
      paye: latestPAYE?.dueDate || taxSummary.next_filing_dates.paye,
      cit: latestCIT?.dueDate || taxSummary.next_filing_dates.cit,
      qit: latestQIT?.dueDate || taxSummary.next_filing_dates.qit,
    },
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Filed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleGenerateCurrentReturns = async () => {
    setIsLoading(true);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentYear = new Date().getFullYear().toString();

    try {
      const currentSummary = TaxService.getTaxSummary();
      const vatReturn = TaxService.generateVATReturn(currentMonth);
      const payeReturn = TaxService.generatePAYEReturn(currentMonth);
      const citReturn = TaxService.generateCITReturn(currentYear);

      await Promise.all([
        TaxReturnRegisterService.save({
          taxType: "VAT",
          period: currentMonth,
          dueDate: currentSummary.next_filing_dates.vat,
          totalDeclared: Math.max(0, vatReturn.net_vat_payable),
          status: Math.max(0, vatReturn.net_vat_payable) === 0 ? "Filed" : "Pending",
          payload: vatReturn,
        }),
        TaxReturnRegisterService.save({
          taxType: "PAYE",
          period: currentMonth,
          dueDate: currentSummary.next_filing_dates.paye,
          totalDeclared: payeReturn.total_paye,
          status: payeReturn.total_paye === 0 ? "Filed" : "Pending",
          payload: payeReturn,
        }),
        TaxReturnRegisterService.save({
          taxType: "CIT",
          period: currentYear,
          dueDate: currentSummary.next_filing_dates.cit,
          totalDeclared: citReturn.cit_payable,
          status: citReturn.cit_payable === 0 ? "Filed" : "Pending",
          taxYear: currentYear,
          payload: citReturn,
        }),
      ]);

      setTaxSummary(currentSummary);

      toast({
        title: "Returns Generated",
        description: `Current returns saved. VAT: ${TaxService.formatCurrency(
          Math.max(0, vatReturn.net_vat_payable),
        )}, PAYE: ${TaxService.formatCurrency(payeReturn.total_paye)}`,
      });

      await loadTaxReturns();
    } catch (error) {
      console.error("Failed to generate current returns:", error);
      toast({
        title: "Error",
        description: "Failed to generate current returns.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReturns = () => {
    const exportData = {
      summary: dashboardSummary,
      registerSummary,
      returns,
      exportedAt: new Date().toISOString(),
    };

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `tax_returns_export_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleDownloadReturn = (returnItem: TaxReturnRecord) => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(returnItem.payload || returnItem, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute(
      "download",
      `${returnItem.taxType.toLowerCase()}_${returnItem.period.replace(/\s+/g, "_")}.json`,
    );
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const getDaysUntilDue = (dueDate: string) => TaxService.getDaysUntilDeadline(dueDate);

  const handleMarkAsFiled = async (returnId: number) => {
    try {
      await TaxReturnRegisterService.markAsFiled(returnId);
      await loadTaxReturns();
      toast({
        title: "Return Filed",
        description: "Tax return has been marked as filed.",
      });
    } catch (error) {
      console.error("Failed to mark return as filed:", error);
      toast({
        title: "Update Failed",
        description: "Could not mark this tax return as filed.",
        variant: "destructive",
      });
    }
  };

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
            <h1 className="text-2xl font-semibold">Tax Returns & Compliance</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReturns}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button variant="outline" onClick={() => void handleGenerateCurrentReturns()} disabled={isLoading}>
              <FileText className="mr-2 h-4 w-4" />
              {isLoading ? "Calculating..." : "Calculate Current"}
            </Button>
            <Button onClick={() => setShowQITForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record QIT
            </Button>
            <Button onClick={() => setShowTaxReturnForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Return
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {TaxService.formatCurrency(dashboardSummary.vat_due)}
                  </div>
                  <div className="text-sm text-gray-600">VAT Due</div>
                  <div className="text-xs text-red-500">Due: {dashboardSummary.next_filing_dates.vat}</div>
                </div>
                <Receipt className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {TaxService.formatCurrency(dashboardSummary.paye_due)}
                  </div>
                  <div className="text-sm text-gray-600">PAYE Due</div>
                  <div className="text-xs text-red-500">Due: {dashboardSummary.next_filing_dates.paye}</div>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {TaxService.formatCurrency(dashboardSummary.cit_due)}
                  </div>
                  <div className="text-sm text-gray-600">CIT Estimated</div>
                  <div className="text-xs text-red-500">Due: {dashboardSummary.next_filing_dates.cit}</div>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{registerSummary.pendingReturns + registerSummary.overdueReturns}</div>
                  <div className="text-sm text-gray-600">Pending Returns</div>
                  <div className="text-xs text-orange-500">Action Required</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Upcoming Filing Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "VAT", date: dashboardSummary.next_filing_dates.vat, amount: dashboardSummary.vat_due },
                { type: "PAYE", date: dashboardSummary.next_filing_dates.paye, amount: dashboardSummary.paye_due },
                { type: "CIT", date: dashboardSummary.next_filing_dates.cit, amount: dashboardSummary.cit_due },
                { type: "QIT", date: dashboardSummary.next_filing_dates.qit, amount: dashboardSummary.qit_due },
              ].map((deadline) => {
                const daysLeft = getDaysUntilDue(deadline.date);
                const isUrgent = daysLeft <= 7;

                return (
                  <div
                    key={`${deadline.type}-${deadline.date}`}
                    className={`flex items-center justify-between rounded-lg p-3 ${
                      isUrgent ? "border border-red-200 bg-red-50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={isUrgent ? "destructive" : "secondary"}>{deadline.type}</Badge>
                      <span className="font-medium">{deadline.date}</span>
                      <span className={`text-sm ${isUrgent ? "text-red-600" : "text-gray-600"}`}>
                        {daysLeft > 0 ? `(${daysLeft} days left)` : `(${Math.abs(daysLeft)} days overdue)`}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{TaxService.formatCurrency(deadline.amount)}</div>
                      <div className="text-xs text-gray-500">Estimated</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-4 flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Tax Returns Register
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(event) => setFilterType(event.target.value)}
                  className="rounded border bg-white px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="vat">VAT</option>
                  <option value="paye">PAYE</option>
                  <option value="cit">CIT</option>
                  <option value="qit">QIT</option>
                </select>
                <Input
                  placeholder="Search returns..."
                  className="max-w-xs"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead className="text-right">Total Declared</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                        No tax returns found. Generate or record a return to start the register.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReturns.map((returnItem) => (
                      <TableRow key={returnItem.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Badge variant="outline">{returnItem.taxType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{returnItem.period}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {returnItem.dueDate}
                            {getDaysUntilDue(returnItem.dueDate) <= 7 && getDaysUntilDue(returnItem.dueDate) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {getDaysUntilDue(returnItem.dueDate)}d
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{returnItem.submissionDate || "Not submitted"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {TaxService.formatCurrency(returnItem.totalDeclared)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(returnItem.status)}>{returnItem.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedReturn(returnItem)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadReturn(returnItem)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {returnItem.status !== "Filed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleMarkAsFiled(returnItem.id)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedReturn?.taxType} Return - {selectedReturn?.period}
              </DialogTitle>
            </DialogHeader>
            {selectedReturn && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 rounded bg-gray-50 p-4 text-sm">
                  <div>
                    <div className="text-gray-600">Due Date</div>
                    <div className="font-medium">{selectedReturn.dueDate}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Submission Date</div>
                    <div className="font-medium">{selectedReturn.submissionDate || "Not submitted"}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <div className="font-medium">{selectedReturn.status}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Declared Amount</div>
                    <div className="font-medium">{TaxService.formatCurrency(selectedReturn.totalDeclared)}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium text-gray-700">Stored Payload</div>
                  <pre className="max-h-80 overflow-auto rounded bg-slate-950 p-4 text-xs text-slate-100">
                    {JSON.stringify(selectedReturn.payload || selectedReturn, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <TaxReturnForm
          open={showTaxReturnForm}
          onClose={() => setShowTaxReturnForm(false)}
          onSuccess={async () => {
            setTaxSummary(TaxService.getTaxSummary());
            await loadTaxReturns();
            toast({
              title: "Success",
              description: "Tax return has been generated and saved.",
            });
          }}
        />

        <QITForm
          open={showQITForm}
          onClose={() => setShowQITForm(false)}
          onSuccess={async () => {
            await loadTaxReturns();
            toast({
              title: "Success",
              description: "QIT return has been saved.",
            });
          }}
        />
      </div>
    </div>
  );
}
