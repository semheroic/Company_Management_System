import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Download, FileText } from "lucide-react";
import TaxService, { CITReturn, PAYEReturn, QITReturn, VATReturn } from "@/services/taxService";
import TaxReturnRegisterService from "@/services/taxReturnRegisterService";

interface TaxReturnFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function TaxReturnForm({ open, onClose, onSuccess }: TaxReturnFormProps) {
  const { toast } = useToast();
  const [returnType, setReturnType] = useState<"VAT" | "PAYE" | "CIT" | "QIT">("VAT");
  const [period, setPeriod] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [generatedReturn, setGeneratedReturn] = useState<VATReturn | PAYEReturn | CITReturn | QITReturn | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatNumber = (value: number | undefined): string => (value || 0).toLocaleString();

  const getDueDate = () => {
    if (returnType === "VAT" || returnType === "PAYE") {
      const monthDate = new Date(`${period}-01`);
      const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 15);
      return dueDate.toISOString().split("T")[0];
    }

    if (returnType === "CIT") {
      return `${Number(period) + 1}-03-31`;
    }

    return `${year}-${quarter === "Q1" ? "03-31" : quarter === "Q2" ? "06-30" : quarter === "Q3" ? "09-30" : "12-31"}`;
  };

  const buildSavePayload = () => {
    if (!generatedReturn) {
      return null;
    }

    switch (returnType) {
      case "VAT": {
        const vatReturn = generatedReturn as VATReturn;
        const totalDeclared = Math.max(0, vatReturn.net_vat_payable);
        return {
          taxType: "VAT",
          period: vatReturn.period,
          dueDate: getDueDate(),
          totalDeclared,
          status: totalDeclared === 0 ? ("Filed" as const) : ("Pending" as const),
          taxYear: vatReturn.period.slice(0, 4),
          payload: vatReturn,
        };
      }
      case "PAYE": {
        const payeReturn = generatedReturn as PAYEReturn;
        return {
          taxType: "PAYE",
          period: payeReturn.period,
          dueDate: getDueDate(),
          totalDeclared: payeReturn.total_paye,
          status: payeReturn.total_paye === 0 ? ("Filed" as const) : ("Pending" as const),
          taxYear: payeReturn.period.slice(0, 4),
          payload: payeReturn,
        };
      }
      case "CIT": {
        const citReturn = generatedReturn as CITReturn;
        return {
          taxType: "CIT",
          period: citReturn.year,
          dueDate: getDueDate(),
          totalDeclared: citReturn.cit_payable,
          status: citReturn.cit_payable === 0 ? ("Filed" as const) : ("Pending" as const),
          taxYear: citReturn.year,
          payload: citReturn,
        };
      }
      case "QIT": {
        const qitReturn = generatedReturn as QITReturn;
        return {
          taxType: "QIT",
          period: `${qitReturn.quarter} ${qitReturn.year}`,
          dueDate: qitReturn.due_date,
          submissionDate: qitReturn.paid ? qitReturn.paid_date : null,
          totalDeclared: qitReturn.tax_amount,
          status: qitReturn.paid ? ("Filed" as const) : ("Pending" as const),
          quarter: qitReturn.quarter,
          taxYear: qitReturn.year,
          payload: qitReturn,
        };
      }
      default:
        return null;
    }
  };

  const handleGenerateReturn = async () => {
    if (returnType !== "QIT" && !period) {
      toast({
        title: "Validation Error",
        description: "Please select a period.",
        variant: "destructive",
      });
      return;
    }

    if (returnType === "QIT" && (!quarter || !year)) {
      toast({
        title: "Validation Error",
        description: "Please select a quarter and year for QIT.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let result;

      switch (returnType) {
        case "VAT":
          result = TaxService.generateVATReturn(period);
          break;
        case "PAYE":
          result = TaxService.generatePAYEReturn(period);
          break;
        case "CIT":
          result = TaxService.generateCITReturn(period);
          break;
        case "QIT":
          result = TaxService.generateQITReturn(quarter, year);
          break;
      }

      setGeneratedReturn(result);

      toast({
        title: "Return Generated",
        description: `${returnType} return has been generated successfully.`,
      });
    } catch (error) {
      console.error("Failed to generate tax return:", error);
      toast({
        title: "Error",
        description: `Failed to generate ${returnType} return.`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReturn = () => {
    if (!generatedReturn) {
      return;
    }

    const filename =
      returnType === "QIT"
        ? `${returnType}_return_${quarter}_${year}.json`
        : `${returnType}_return_${period}.json`;

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedReturn, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", filename);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = buildSavePayload();

    if (!payload) {
      return;
    }

    setIsSaving(true);
    try {
      await TaxReturnRegisterService.save(payload);
      await onSuccess();
      onClose();
      setGeneratedReturn(null);
      setPeriod("");
      setQuarter("Q1");
      setYear(new Date().getFullYear().toString());
      setReturnType("VAT");
    } catch (error: any) {
      console.error("Tax return save failed:", error);
      toast({
        title: "Save Failed",
        description: error?.response?.data?.error || "Could not save the tax return.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderReturnPreview = () => {
    if (!generatedReturn) {
      return null;
    }

    if (returnType === "VAT") {
      const vatReturn = generatedReturn as VATReturn;
      return (
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <h4 className="font-semibold">VAT Return Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Period:</span>
              <span className="ml-2 font-medium">{vatReturn.period || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Sales:</span>
              <span className="ml-2 font-medium">RWF {formatNumber(vatReturn.total_sales)}</span>
            </div>
            <div>
              <span className="text-gray-600">Sales VAT:</span>
              <span className="ml-2 font-medium">RWF {formatNumber(vatReturn.sales_vat)}</span>
            </div>
            <div>
              <span className="text-gray-600">Purchase VAT:</span>
              <span className="ml-2 font-medium">RWF {formatNumber(vatReturn.purchase_vat)}</span>
            </div>
            <div className="col-span-2 border-t pt-2">
              <span className="text-gray-600">Net VAT Payable:</span>
              <span className="ml-2 text-lg font-bold text-blue-600">
                RWF {formatNumber(vatReturn.net_vat_payable)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (returnType === "PAYE") {
      const payeReturn = generatedReturn as PAYEReturn;
      return (
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <h4 className="font-semibold">PAYE Return Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Period:</span>
              <span className="ml-2 font-medium">{payeReturn.period || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">Employees:</span>
              <span className="ml-2 font-medium">{payeReturn.employees?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Gross Salary:</span>
              <span className="ml-2 font-medium">RWF {formatNumber(payeReturn.total_gross_salary)}</span>
            </div>
            <div>
              <span className="text-gray-600">Total RSSB:</span>
              <span className="ml-2 font-medium">RWF {formatNumber(payeReturn.total_rssb)}</span>
            </div>
            <div className="col-span-2 border-t pt-2">
              <span className="text-gray-600">Total PAYE Due:</span>
              <span className="ml-2 text-lg font-bold text-green-600">
                RWF {formatNumber(payeReturn.total_paye)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (returnType === "CIT") {
      const citReturn = generatedReturn as CITReturn;
      return (
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <h4 className="font-semibold">CIT Return Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Year:</span>
              <span className="ml-2 font-medium">{citReturn.year || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">Tax Rate:</span>
              <span className="ml-2 font-medium">{(citReturn.tax_rate || 0) * 100}%</span>
            </div>
            <div>
              <span className="text-gray-600">Total Revenue:</span>
              <span className="ml-2 font-medium">RWF {formatNumber(citReturn.turnover)}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Expenses:</span>
              <span className="ml-2 font-medium">RWF {formatNumber(citReturn.total_expenses)}</span>
            </div>
            <div>
              <span className="text-gray-600">Taxable Profit:</span>
              <span className="ml-2 font-medium">RWF {formatNumber(citReturn.profit)}</span>
            </div>
            <div className="border-t pt-2">
              <span className="text-gray-600">CIT Payable:</span>
              <span className="ml-2 text-lg font-bold text-red-600">
                RWF {formatNumber(citReturn.cit_payable)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    const qitReturn = generatedReturn as QITReturn;
    return (
      <div className="space-y-3 rounded-lg bg-gray-50 p-4">
        <h4 className="font-semibold">QIT Return Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Quarter:</span>
            <span className="ml-2 font-medium">
              {qitReturn.quarter} {qitReturn.year}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Tax Rate:</span>
            <span className="ml-2 font-medium">{qitReturn.tax_rate}%</span>
          </div>
          <div>
            <span className="text-gray-600">Estimated Income:</span>
            <span className="ml-2 font-medium">RWF {formatNumber(qitReturn.estimated_income)}</span>
          </div>
          <div>
            <span className="text-gray-600">Due Date:</span>
            <span className="ml-2 font-medium">{qitReturn.due_date}</span>
          </div>
          <div>
            <span className="text-gray-600">Payment Status:</span>
            <span className={`ml-2 font-medium ${qitReturn.paid ? "text-green-600" : "text-red-600"}`}>
              {qitReturn.paid ? "Paid" : "Unpaid"}
            </span>
          </div>
          <div className="border-t pt-2">
            <span className="text-gray-600">QIT Payable:</span>
            <span className="ml-2 text-lg font-bold text-orange-600">
              RWF {formatNumber(qitReturn.tax_amount)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPeriodInput = () => {
    if (returnType === "QIT") {
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="quarter">Quarter</Label>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger>
                <SelectValue placeholder="Select quarter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              min="2020"
              max={new Date().getFullYear().toString()}
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <Label htmlFor="period">Period</Label>
        <Input
          id="period"
          type={returnType === "CIT" ? "number" : "month"}
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          placeholder={returnType === "CIT" ? "2024" : "2024-06"}
          min={returnType === "CIT" ? "2020" : undefined}
          max={returnType === "CIT" ? new Date().getFullYear().toString() : undefined}
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Tax Return
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="returnType">Tax Return Type</Label>
              <Select value={returnType} onValueChange={(value: any) => setReturnType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select return type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAT">VAT Return</SelectItem>
                  <SelectItem value="PAYE">PAYE Return</SelectItem>
                  <SelectItem value="CIT">CIT Return</SelectItem>
                  <SelectItem value="QIT">QIT Return</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderPeriodInput()}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void handleGenerateReturn()}
              disabled={
                isGenerating ||
                (returnType !== "QIT" && !period) ||
                (returnType === "QIT" && (!quarter || !year))
              }
              className="flex-1"
            >
              <Calculator className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Return"}
            </Button>

            {generatedReturn && (
              <Button type="button" variant="outline" onClick={handleDownloadReturn}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>

          {renderReturnPreview()}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={!generatedReturn || isSaving}>
              {isSaving ? "Saving..." : "Save Return"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
