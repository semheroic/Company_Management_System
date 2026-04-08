import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PiggyBank, Upload, Loader2 } from "lucide-react";
import UniversalTransactionHandler from "@/services/universalTransactionHandler";
import axios from "axios"; // Added Axios
import { useParams } from "react-router-dom"; // To get companyId from URL

interface CapitalEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CapitalEntryForm({ open, onClose, onSuccess }: CapitalEntryFormProps) {
  const { toast } = useToast();
  const { companyId } = useParams(); // Assumes route is /company/:companyId/...
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    shareholder_name: '',
    shareholder_id: '',
    amount: '',
    date_contributed: new Date().toISOString().split('T')[0],
    method: 'bank_transfer',
    type: 'contribution',
    description: '',
    file_url: '',
    status: 'confirmed',
    shares_allocated: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.shareholder_name || !formData.amount || !formData.date_contributed || !formData.method) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare Backend Payload for Table 5 (capital_entries)
      const backendPayload = {
        shareholder_id: formData.shareholder_id,
        amount: parseFloat(formData.amount),
        transaction_type: formData.type,
        date_contributed: formData.date_contributed,
        payment_method: formData.method,
        status: formData.status,
        shares_allocated: formData.shares_allocated ? parseInt(formData.shares_allocated) : null,
        description: formData.description,
        document_url: formData.file_url
      };

      // 2. Map form type to UTS transaction type for Accounting (Double Entry)
      const transactionType = formData.type === 'contribution' ? 'capital_contribution' : 
                             formData.type === 'withdrawal' ? 'capital_withdrawal' : 'equity_adjustment';
      const BASE_URL = "http://localhost:5000";
      // 3. EXECUTE API CALL TO BACKEND
      const apiResponse = await axios.post(
        `${BASE_URL}/api/company/${companyId}/capital/entry`, 
        backendPayload
      );

      if (apiResponse.data.success) {
        // 4. TRIGGER UTS (Accounting integration)
        // We keep this because your frontend uses UTS to sync with the General Ledger
        await UniversalTransactionHandler.processTransaction({
          type: transactionType as any,
          amount: parseFloat(formData.amount),
          description: formData.description || `Capital ${formData.type} by ${formData.shareholder_name}`,
          date: formData.date_contributed,
          payment_method: formData.method === 'cash' ? 'cash' : 'bank',
          payment_status: 'paid',
          reference_number: apiResponse.data.reference_number || `CAP-${Date.now()}`,
          supporting_documents: formData.file_url ? [formData.file_url] : [],
          additional_data: {
            ...backendPayload,
            shareholder_name: formData.shareholder_name
          }
        });

        toast({
          title: "Success",
          description: "Capital entry saved to database and posted to accounts.",
        });

        onSuccess();
        onClose();
        resetForm();
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Server Error",
        description: error.response?.data?.message || "Failed to connect to the server",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      shareholder_name: '',
      shareholder_id: '',
      amount: '',
      date_contributed: new Date().toISOString().split('T')[0],
      method: 'bank_transfer',
      type: 'contribution',
      description: '',
      file_url: '',
      status: 'confirmed',
      shares_allocated: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-green-600" />
            Record Capital Entry (Integrated MariaDB)
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Securely record equity transactions. Changes reflect in your Balance Sheet and Share Register.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shareholder_name">Shareholder Name *</Label>
              <Input
                id="shareholder_name"
                value={formData.shareholder_name}
                onChange={(e) => setFormData({...formData, shareholder_name: e.target.value})}
                placeholder="Enter shareholder name"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Entry Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contribution">💰 Capital Contribution</SelectItem>
                  <SelectItem value="withdrawal">💸 Capital Withdrawal</SelectItem>
                  <SelectItem value="adjustment">⚖️ Capital Adjustment</SelectItem>
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
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0"
                min="0"
                step="1000"
                required
              />
            </div>
            <div>
              <Label htmlFor="shares_allocated">Shares Allocated</Label>
              <Input
                id="shares_allocated"
                type="number"
                value={formData.shares_allocated}
                onChange={(e) => setFormData({...formData, shares_allocated: e.target.value})}
                placeholder="Number of shares (optional)"
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
                onChange={(e) => setFormData({...formData, date_contributed: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="method">Payment Method *</Label>
              <Select value={formData.method} onValueChange={(value) => setFormData({...formData, method: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  <SelectItem value="asset_in_kind">🏠 Asset in Kind</SelectItem>
                  <SelectItem value="other">📋 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="e.target.value"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="file_url">Supporting Document URL</Label>
            <div className="flex gap-2">
              <Input
                id="file_url"
                value={formData.file_url}
                onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                placeholder="URL to bank slip or agreement"
              />
              <Button type="button" variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Transaction Preview */}
          {formData.amount && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                📊 Accounting Preview
              </h4>
              <div className="text-sm space-y-1">
                {formData.type === 'contribution' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-mono">Dr: {formData.method === 'cash' ? '1001-Cash' : '1002-Bank'}</span>
                      <span className="font-bold text-green-700">+{parseFloat(formData.amount || '0').toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-mono">Cr: 3001-Share Capital</span>
                      <span className="font-bold text-blue-700">+{parseFloat(formData.amount || '0').toLocaleString()} RWF</span>
                    </div>
                  </>
                )}
                <p className="text-[10px] text-blue-700 mt-2 italic uppercase">
                  Automated Journal Posting Enabled
                </p>
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
                  Processing...
                </>
              ) : (
                "Post to Ledger"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}