import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, DollarSign, AlertTriangle, Loader2 } from "lucide-react";
import { CompanyCapital } from "@/services/companyCapitalService";
import axios from "axios";

interface CompanyCapitalFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: CompanyCapital | null;
}

export function CompanyCapitalForm({ open, onClose, onSuccess, editData }: CompanyCapitalFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    authorized_shares: "",
    share_price: "",
    currency: "RWF",
    capital_type: "ordinary"
  });

  const [calculatedValues, setCalculatedValues] = useState({
    total_authorized_capital: 0,
    per_share_value: 0
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        authorized_shares: editData.authorized_shares.toString(),
        share_price: editData.share_price.toString(),
        currency: editData.currency,
        capital_type: editData.capital_type
      });
    } else {
      setFormData({
        authorized_shares: "",
        share_price: "",
        currency: "RWF",
        capital_type: "ordinary"
      });
    }
  }, [editData, open]);

  useEffect(() => {
    const shares = parseFloat(formData.authorized_shares || '0');
    const price = parseFloat(formData.share_price || '0');
    
    setCalculatedValues({
      total_authorized_capital: shares * price,
      per_share_value: price
    });
  }, [formData.authorized_shares, formData.share_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.authorized_shares || !formData.share_price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const shares = parseFloat(formData.authorized_shares);
    const price = parseFloat(formData.share_price);

    if (shares <= 0 || price <= 0) {
      toast({
        title: "Validation Error",
        description: "Shares and price must be positive numbers",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const companyId = localStorage.getItem('selectedCompanyId');
      if (!companyId) {
        throw new Error("No company selected");
      }

      // 1. Prepare payload for the database (Table 6)
      const capitalData = {
        authorized_shares: shares,
        share_price: price,
        currency: formData.currency,
        capital_type: formData.capital_type as 'ordinary' | 'preference' | 'mixed'
      };

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const endpoint = `${baseUrl}/api/company/${companyId}/capital-structure`;
      await axios.post(endpoint, capitalData, {
        headers: { "x-company-id": companyId }
      });

      toast({
        title: "Success",
        description: editData ? "Capital structure updated" : "Company capital structure initialized successfully"
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Backend error:", error);
      toast({
        title: "System Error",
        description: error.response?.data?.error || error.message || "Failed to communicate with capital management service",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            {editData ? "Edit Capital Structure" : "Initialize Company Capital"}
          </DialogTitle>
        </DialogHeader>

        <Alert className="bg-slate-50">
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            This sets up your company&apos;s authorized share capital. You can issue shares up to this limit.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authorized_shares">Authorized Shares *</Label>
              <Input
                id="authorized_shares"
                type="number"
                min="1"
                value={formData.authorized_shares}
                onChange={(e) => setFormData({ ...formData, authorized_shares: e.target.value })}
                placeholder="e.g., 10000"
                required
              />
              <p className="text-[10px] text-gray-500">
                Maximum units your company is legally permitted to issue.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share_price">Price per Share *</Label>
              <Input
                id="share_price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.share_price}
                onChange={(e) => setFormData({ ...formData, share_price: e.target.value })}
                placeholder="e.g., 1000"
                required
              />
              <p className="text-[10px] text-gray-500">
                The nominal (par) value per unit in {formData.currency}.
              </p>
            </div>

            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="capital_type">Capital Type *</Label>
              <Select value={formData.capital_type} onValueChange={(value) => setFormData({ ...formData, capital_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ordinary">Ordinary Shares</SelectItem>
                  <SelectItem value="preference">Preference Shares</SelectItem>
                  <SelectItem value="mixed">Mixed (Ordinary + Preference)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calculated Values Preview */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 text-sm mb-3">Equity Summary Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-gray-600">Authorized Volume:</span>
                <span className="font-bold text-sm">{parseFloat(formData.authorized_shares || '0').toLocaleString()} Units</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-600">Unit Valuation:</span>
                <span className="font-bold text-sm">{parseFloat(formData.share_price || '0').toLocaleString()} {formData.currency}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-blue-200 mt-1">
                <span className="text-gray-600">Total Market/Par Capitalization:</span>
                <div className="font-bold text-lg text-blue-700">
                  {calculatedValues.total_authorized_capital.toLocaleString()} {formData.currency}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Check for Rwanda */}
          {calculatedValues.total_authorized_capital < 100000 && formData.currency === 'RWF' && formData.authorized_shares !== "" && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Minimum capital requirements for certain company types in Rwanda may apply (RDB Law).
              </AlertDescription>
            </Alert>
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
                editData ? "Update Structure" : "Initialize Structure"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
