import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Download, Users } from "lucide-react";
import PayrollRegisterService, {
  PayrollRecord,
  PayrollSummary,
} from "@/services/payrollRegisterService";

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.message || fallback;

interface PayrollFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayrollForm({ open, onClose, onSuccess }: PayrollFormProps) {
  const { toast } = useToast();
  const [month, setMonth] = useState("");
  const [generatedPayroll, setGeneratedPayroll] = useState<PayrollRecord[] | null>(null);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [accountingReference, setAccountingReference] = useState<string | null>(null);

  const handleGeneratePayroll = async () => {
    if (!month) {
      toast({
        title: "Validation Error",
        description: "Please select a month",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await PayrollRegisterService.generate(month);
      setGeneratedPayroll(response.records);
      setPayrollSummary(response.summary);
      setAccountingReference(null);

      toast({
        title: "Payroll Generated",
        description: `Payroll for ${month} has been generated successfully for ${response.records.length} employees`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to generate payroll"),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostToAccounting = async () => {
    if (!generatedPayroll || !month) {
      return;
    }

    setIsPosting(true);
    try {
      const response = await PayrollRegisterService.postToAccounting(month);
      setGeneratedPayroll(response.records);
      setPayrollSummary(response.summary);
      setAccountingReference(response.reference || null);
      onSuccess();

      toast({
        title: "Posted to Accounting",
        description: response.reference
          ? `Payroll posted successfully with journal ${response.reference}.`
          : "Payroll transactions have been posted to the accounting system.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to post to accounting"),
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDownloadPayroll = () => {
    if (!generatedPayroll || !month) {
      return;
    }

    const csvData = PayrollRegisterService.exportToCSV(generatedPayroll);
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `payroll_${month}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "Payroll has been exported to CSV",
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!generatedPayroll) {
      return;
    }

    onSuccess();
    onClose();
    setGeneratedPayroll(null);
    setPayrollSummary(null);
    setAccountingReference(null);
    setMonth("");
  };

  const formatCurrency = (amount: number) => PayrollRegisterService.formatCurrency(amount);
  const isPostedToAccounting =
    generatedPayroll?.length ? generatedPayroll.every((record) => Boolean(record.accountingPostedAt)) : false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Generate Monthly Payroll
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Payroll Month</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                max={new Date().toISOString().slice(0, 7)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={handleGeneratePayroll}
                disabled={isGenerating || !month}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Payroll"}
              </Button>
            </div>
          </div>

          {payrollSummary && (
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-3 flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4" />
                Payroll Summary for {payrollSummary.month}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <span className="text-gray-600">Total Employees:</span>
                  <span className="ml-2 font-medium">{payrollSummary.totalEmployees}</span>
                </div>
                <div>
                  <span className="text-gray-600">Gross Pay:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(payrollSummary.totalGrossPay)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total PAYE:</span>
                  <span className="ml-2 font-medium">{formatCurrency(payrollSummary.totalPaye)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total RSSB:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(
                      payrollSummary.totalRssbEmployee + payrollSummary.totalRssbEmployer,
                    )}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Net Pay:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">
                    {formatCurrency(payrollSummary.totalNetPay)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Paid:</span>
                  <span className="ml-2 font-medium">{payrollSummary.paidCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Unpaid:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {payrollSummary.unpaidCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {generatedPayroll && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Payroll Details</h4>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleDownloadPayroll}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePostToAccounting}
                    disabled={isPosting || isPostedToAccounting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isPosting
                      ? "Posting..."
                      : isPostedToAccounting
                        ? "Posted to Accounting"
                        : "Post to Accounting"}
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="border-b p-3 text-left">Employee</th>
                      <th className="border-b p-3 text-left">Position</th>
                      <th className="border-b p-3 text-right">Gross Salary</th>
                      <th className="border-b p-3 text-right">PAYE</th>
                      <th className="border-b p-3 text-right">RSSB</th>
                      <th className="border-b p-3 text-right">Net Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedPayroll.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">
                              {record.employee?.fullName || "Employee"}
                            </div>
                            <div className="text-gray-500">
                              {record.employee?.email || "No email"}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">{record.employee?.position || "-"}</td>
                        <td className="p-3 text-right">{formatCurrency(record.grossSalary)}</td>
                        <td className="p-3 text-right">{formatCurrency(record.paye)}</td>
                        <td className="p-3 text-right">{formatCurrency(record.rssbEmployee)}</td>
                        <td className="p-3 text-right font-semibold">
                          {formatCurrency(record.netSalary)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <h5 className="mb-2 font-medium text-green-800">Accounting Integration</h5>
                <p className="text-sm text-green-700">
                  {isPostedToAccounting && accountingReference
                    ? `Posted successfully under journal ${accountingReference}.`
                    : "Once posted to accounting, this payroll will create accrued salary liabilities first. Marking payments as paid will then clear them through cash in the general ledger."}
                </p>
                {!isPostedToAccounting && (
                  <ul className="mt-2 space-y-1 text-sm text-green-700">
                    <li>- Journal entries for salary expense and payroll liabilities</li>
                    <li>- General ledger postings for PAYE, RSSB, and accrued salaries</li>
                    <li>- Separate cash entries when each employee payment is marked as paid</li>
                    <li>- PAYE and RSSB payable balances for tax filing</li>
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!generatedPayroll}>
              Save Payroll
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
