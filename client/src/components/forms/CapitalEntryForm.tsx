import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PiggyBank, Upload, Loader2 } from "lucide-react";
import axios from "axios";
import { COMPANY_BASE_URL } from "@/services/companyApi";

interface CapitalEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ShareholderOption {
  id: string;
  name: string;
  shares_held: number;
}

export function CapitalEntryForm({ open, onClose, onSuccess }: CapitalEntryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareholders, setShareholders] = useState<ShareholderOption[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    shareholder_id: "",
    amount: "",
    date_contributed: new Date().toISOString().split("T")[0],
    method: "bank_transfer",
    entry_type: "contribution",
    description: "",
    status: "confirmed",
    shares_allocated: "",
  });

  useEffect(() => {
    if (!open) return;

    const loadShareholders = async () => {
      const companyId = localStorage.getItem("selectedCompanyId");
      if (!companyId) {
        setShareholders([]);
        return;
      }

      try {
        const response = await axios.get(`${COMPANY_BASE_URL}/${companyId}/members`, {
          headers: { "x-company-id": companyId },
        });

        setShareholders(
          (response.data || []).map((member: any) => ({
            id: String(member.id),
            name: member.name,
            shares_held: Number(member.shares_held || 0),
          }))
        );
      } catch {
        setShareholders([]);
      }
    };

    loadShareholders();
  }, [open]);

  const resetForm = () => {
    setFormData({
      shareholder_id: "",
      amount: "",
      date_contributed: new Date().toISOString().split("T")[0],
      method: "bank_transfer",
      entry_type: "contribution",
      description: "",
      status: "confirmed",
      shares_allocated: "",
    });
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.shareholder_id || !formData.amount || !formData.date_contributed || !formData.method) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const companyId = localStorage.getItem("selectedCompanyId");
      if (!companyId) {
        throw new Error("No company selected");
      }

      const payload = new FormData();
      payload.append("shareholder_id", formData.shareholder_id);
      payload.append("amount", formData.amount);
      payload.append("date_contributed", formData.date_contributed);
      payload.append("method", formData.method);
      payload.append("entry_type", formData.entry_type);
      payload.append("description", formData.description);
      payload.append("status", formData.status);
      if (formData.shares_allocated) {
        payload.append("shares_allocated", formData.shares_allocated);
      }
      if (selectedFile) {
        payload.append("file", selectedFile);
      }

      await axios.post(`${COMPANY_BASE_URL}/${companyId}/capital/entry`, payload, {
        headers: {
          "x-company-id": companyId,
          "Content-Type": "multipart/form-data",
        },
      });

      const shareholder = shareholders.find((item) => item.id === formData.shareholder_id);
      toast({
        title: "Success",
        description: `Capital entry recorded for ${shareholder?.name || "shareholder"}.`,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Server Error",
        description: error.response?.data?.error || error.message || "Failed to save capital entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedShareholder = shareholders.find((item) => item.id === formData.shareholder_id);
  const amountValue = Number(formData.amount || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-green-600" />
            Record Capital Entry
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Save a capital contribution, withdrawal, or adjustment directly to the backend ledger.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shareholder_id">Shareholder *</Label>
              <Select value={formData.shareholder_id} onValueChange={(value) => setFormData({ ...formData, shareholder_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shareholder" />
                </SelectTrigger>
                <SelectContent>
                  {shareholders.map((shareholder) => (
                    <SelectItem key={shareholder.id} value={shareholder.id}>
                      {shareholder.name} ({shareholder.shares_held.toLocaleString()} shares)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="entry_type">Entry Type *</Label>
              <Select value={formData.entry_type} onValueChange={(value) => setFormData({ ...formData, entry_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contribution">Capital Contribution</SelectItem>
                  <SelectItem value="withdrawal">Capital Withdrawal</SelectItem>
                  <SelectItem value="adjustment">Capital Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (RWF) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <Label htmlFor="shares_allocated">Shares Allocated</Label>
              <Input
                id="shares_allocated"
                type="number"
                value={formData.shares_allocated}
                onChange={(e) => setFormData({ ...formData, shares_allocated: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_contributed">Date *</Label>
              <Input
                id="date_contributed"
                type="date"
                value={formData.date_contributed}
                onChange={(e) => setFormData({ ...formData, date_contributed: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="method">Payment Method *</Label>
              <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="asset_in_kind">Asset in Kind</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Reason or supporting detail"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="file">Supporting Document</Label>
            <div className="flex gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <Button type="button" variant="outline" size="sm" disabled>
                <Upload className="w-4 h-4 mr-2" />
                {selectedFile ? "Attached" : "Optional"}
              </Button>
            </div>
          </div>

          {amountValue > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shareholder</span>
                  <span className="font-medium">{selectedShareholder?.name || "Not selected"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">{amountValue.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shares impact</span>
                  <span className="font-medium">
                    {formData.shares_allocated ? Number(formData.shares_allocated).toLocaleString() : "0"} shares
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
