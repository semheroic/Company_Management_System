import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AccountingBooksService, { AccountingAccount } from "@/services/accountingBooksService";

interface AccountingEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

const initialState = {
  entryType: "manual",
  date: new Date().toISOString().split("T")[0],
  accountId: "",
  offsetAccountId: "",
  debit: "",
  credit: "",
  description: "",
  referenceNo: "",
  receipt: null as File | null,
};

export function AccountingEntryForm({ open, onClose, onSuccess }: AccountingEntryFormProps) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (!open) return;

    const loadAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const response = await AccountingBooksService.getAccounts();
        setAccounts(response);
      } catch (error: any) {
        toast({
          title: "Accounts Load Failed",
          description: error.response?.data?.error || "Could not load chart of accounts.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    void loadAccounts();
  }, [open, toast]);

  const resetForm = () => {
    setFormData(initialState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const debit = Number(formData.debit || 0);
    const credit = Number(formData.credit || 0);

    if (!formData.accountId || !formData.offsetAccountId) {
      toast({
        title: "Validation Error",
        description: "Both the main account and balancing account are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.accountId === formData.offsetAccountId) {
      toast({
        title: "Validation Error",
        description: "Main account and balancing account must be different.",
        variant: "destructive",
      });
      return;
    }

    if ((debit > 0 && credit > 0) || (debit <= 0 && credit <= 0)) {
      toast({
        title: "Validation Error",
        description: "Enter either a debit amount or a credit amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await AccountingBooksService.createManualEntry({
        entryType: formData.entryType,
        date: formData.date,
        account_id: Number(formData.accountId),
        offset_account_id: Number(formData.offsetAccountId),
        debit: debit > 0 ? debit : undefined,
        credit: credit > 0 ? credit : undefined,
        description: formData.description,
        reference_no: formData.referenceNo || undefined,
        receipt: formData.receipt,
      });

      toast({
        title: "Entry Posted",
        description: "The manual accounting entry has been posted to the backend ledger.",
      });

      resetForm();
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Manual accounting entry failed:", error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.error || "Could not save the manual accounting entry.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      receipt: e.target.files?.[0] || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Accounting Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entryType">Entry Type *</Label>
              <Select value={formData.entryType} onValueChange={(value) => setFormData({ ...formData, entryType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Journal</SelectItem>
                  <SelectItem value="cash">Cash Book</SelectItem>
                  <SelectItem value="bank">Bank Book</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="account">Main Account *</Label>
              <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingAccounts ? "Loading accounts..." : "Select account"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="offsetAccount">Balancing Account *</Label>
              <Select
                value={formData.offsetAccountId}
                onValueChange={(value) => setFormData({ ...formData, offsetAccountId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingAccounts ? "Loading accounts..." : "Select balancing account"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="debit">Debit Amount (RWF)</Label>
              <Input
                id="debit"
                type="number"
                min="0"
                step="0.01"
                value={formData.debit}
                onChange={(e) => setFormData({ ...formData, debit: e.target.value, credit: "" })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="credit">Credit Amount (RWF)</Label>
              <Input
                id="credit"
                type="number"
                min="0"
                step="0.01"
                value={formData.credit}
                onChange={(e) => setFormData({ ...formData, credit: e.target.value, debit: "" })}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="referenceNo">Reference Number</Label>
            <Input
              id="referenceNo"
              value={formData.referenceNo}
              onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="receipt">Receipt/Document (Optional)</Label>
            <Input
              id="receipt"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="cursor-pointer"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingAccounts}>
              {isSubmitting ? "Posting..." : "Add Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
