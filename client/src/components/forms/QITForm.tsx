import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Calendar, DollarSign, Receipt } from "lucide-react";
import TaxService, { QITReturn } from "@/services/taxService";
import TaxReturnRegisterService, { TaxReturnRecord } from "@/services/taxReturnRegisterService";

interface QITFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  editingQIT?: QITReturn | null;
}

export function QITForm({ open, onClose, onSuccess, editingQIT }: QITFormProps) {
  const { toast } = useToast();
  const [quarter, setQuarter] = useState("Q1");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [estimatedIncome, setEstimatedIncome] = useState("");
  const [taxRate] = useState(30);
  const [paid, setPaid] = useState(false);
  const [paidDate, setPaidDate] = useState("");
  const [rraProofFile, setRraProofFile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingQITs, setExistingQITs] = useState<TaxReturnRecord[]>([]);

  const calculatedTaxAmount = (Number(estimatedIncome) || 0) * (taxRate / 100);

  const getDueDate = () => {
    const quarterDates = {
      Q1: `${year}-03-31`,
      Q2: `${year}-06-30`,
      Q3: `${year}-09-30`,
      Q4: `${year}-12-31`,
    };
    return quarterDates[quarter as keyof typeof quarterDates];
  };

  const loadExistingQITs = async (targetYear: string) => {
    try {
      const response = await TaxReturnRegisterService.getAll();
      setExistingQITs(
        response.records.filter((record) => record.taxType === "QIT" && String(record.taxYear || "").includes(targetYear)),
      );
    } catch (error) {
      console.error("Failed to load QIT records:", error);
      setExistingQITs([]);
    }
  };

  const resetForm = () => {
    setQuarter(TaxService.getCurrentQuarter());
    setYear(new Date().getFullYear().toString());
    setEstimatedIncome("");
    setPaid(false);
    setPaidDate("");
    setRraProofFile("");
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingQIT) {
      setQuarter(editingQIT.quarter);
      setYear(editingQIT.year);
      setEstimatedIncome(editingQIT.estimated_income.toString());
      setPaid(editingQIT.paid);
      setPaidDate(editingQIT.paid_date || "");
      setRraProofFile(editingQIT.rra_proof_file || "");
    } else {
      resetForm();
    }

    void loadExistingQITs(editingQIT?.year || year);
  }, [open, editingQIT]);

  useEffect(() => {
    if (open) {
      void loadExistingQITs(year);
    }
  }, [year, open]);

  const isOverdue = () => {
    const dueDate = new Date(getDueDate());
    return new Date() > dueDate && !paid;
  };

  const handlePaidChange = (checked: boolean | "indeterminate") => {
    setPaid(checked === true);
    if (!checked) {
      setPaidDate("");
      setRraProofFile("");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!estimatedIncome || Number(estimatedIncome) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid estimated income.",
        variant: "destructive",
      });
      return;
    }

    if (paid && !paidDate) {
      toast({
        title: "Validation Error",
        description: "Please enter the payment date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await TaxReturnRegisterService.save({
        taxType: "QIT",
        period: `${quarter} ${year}`,
        dueDate: getDueDate(),
        submissionDate: paid ? paidDate : null,
        totalDeclared: calculatedTaxAmount,
        status: paid ? "Filed" : isOverdue() ? "Overdue" : "Pending",
        quarter,
        taxYear: year,
        payload: {
          quarter,
          year,
          estimated_income: Number(estimatedIncome),
          tax_rate: taxRate,
          tax_amount: calculatedTaxAmount,
          paid,
          paid_date: paid ? paidDate : undefined,
          rra_proof_file: rraProofFile || undefined,
          due_date: getDueDate(),
        },
      });

      toast({
        title: "QIT Record Saved",
        description: `Quarterly Income Tax for ${quarter} ${year} has been recorded successfully.`,
      });

      await onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("QIT save failed:", error);
      toast({
        title: "Save Failed",
        description: error?.response?.data?.error || "Could not save the QIT return.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {editingQIT ? "Edit QIT Record" : "Record QIT Payment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {existingQITs.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="mb-3 flex items-center gap-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  {year} QIT Overview
                </h4>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  {["Q1", "Q2", "Q3", "Q4"].map((currentQuarter) => {
                    const qitRecord = existingQITs.find((qit) => qit.quarter === currentQuarter);
                    const isFiled = qitRecord?.status === "Filed";
                    const isPending = qitRecord?.status === "Pending" || qitRecord?.status === "Overdue";

                    return (
                      <div
                        key={currentQuarter}
                        className={`rounded p-2 text-center ${
                          isFiled
                            ? "bg-green-100 text-green-800"
                            : isPending
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <div className="font-medium">{currentQuarter}</div>
                        <div className="text-xs">{qitRecord ? qitRecord.status : "Not Set"}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
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
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="estimatedIncome">Estimated Income (RWF)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="estimatedIncome"
                type="number"
                value={estimatedIncome}
                onChange={(event) => setEstimatedIncome(event.target.value)}
                placeholder="Enter estimated quarterly income"
                className="pl-10"
                min="0"
                step="1000"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter your estimated income for {quarter} {year}
            </p>
          </div>

          <Card className={isOverdue() ? "border-red-200 bg-red-50" : "bg-gray-50"}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tax Rate:</span>
                  <span className="font-medium">{taxRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="font-medium">{getDueDate()}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm text-gray-600">Calculated Tax Amount:</span>
                  <span className="text-lg font-bold text-blue-600">
                    RWF {calculatedTaxAmount.toLocaleString()}
                  </span>
                </div>
                {isOverdue() && (
                  <div className="text-sm font-medium text-red-600">This payment is overdue.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center space-x-2">
            <Checkbox id="paid" checked={paid} onCheckedChange={handlePaidChange} />
            <Label htmlFor="paid" className="text-sm font-medium">
              Mark as paid
            </Label>
          </div>

          {paid && (
            <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div>
                <Label htmlFor="paidDate">Payment Date</Label>
                <Input
                  id="paidDate"
                  type="date"
                  value={paidDate}
                  onChange={(event) => setPaidDate(event.target.value)}
                  required={paid}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <Label htmlFor="rraProofFile">RRA Receipt Reference</Label>
                <Input
                  id="rraProofFile"
                  type="text"
                  value={rraProofFile}
                  onChange={(event) => setRraProofFile(event.target.value)}
                  placeholder="e.g., QIT-Q1-2026-RRA-1234"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Reference number or file name for the RRA payment receipt.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Receipt className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save QIT Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
