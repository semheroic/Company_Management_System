import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, AlertTriangle, Loader2 } from "lucide-react";

interface ShareTransferFormProps {
  open: boolean;
  onClose: () => void;
  onTransferSuccess: () => void; 
  directors: any[];
  companyId: string | null; // Passed from the database selection
}

export function ShareTransferForm({ open, onClose, onTransferSuccess, directors, companyId }: ShareTransferFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fromMemberId: "",
    toMemberId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0], 
    notes: ""
  });

  const [validation, setValidation] = useState({
    isValid: false,
    errorMessage: "",
    availableShares: 0
  });

  // Calculate impact and validate against DB-provided 'shares_held'
  useEffect(() => {
    const sender = directors.find(d => d.id.toString() === formData.fromMemberId);
    // Use shares_held (MariaDB column) or shares (Frontend mapping)
    const available = sender ? parseFloat(sender.shares_held || sender.shares || '0') : 0;
    const amountNum = parseFloat(formData.amount || '0');

    let error = "";
    if (amountNum <= 0 && formData.amount !== "") error = "Amount must be greater than zero";
    if (amountNum > available) error = `Insufficient shares (Member has ${available.toLocaleString()})`;
    if (formData.fromMemberId && formData.fromMemberId === formData.toMemberId) error = "Cannot transfer to the same person";

    setValidation({
      isValid: !!(formData.fromMemberId && formData.toMemberId && amountNum > 0 && !error),
      errorMessage: error,
      availableShares: available
    });
  }, [formData, directors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid) return;
    if (!companyId) {
      toast({
        title: "No Company Selected",
        description: "Select or create a company first.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend Alignment: /api/company/:companyId/shares/transfer
      // If companyId is "9" and doesn't exist in DB, this triggers the 404
      const response = await axios.post(`/api/company/${companyId}/shares/transfer`, {
        fromMemberId: formData.fromMemberId,
        toMemberId: formData.toMemberId,
        amount: parseFloat(formData.amount),
        notes: formData.notes,
        date: formData.date
      }, {
        headers: { "x-company-id": companyId }
      });

      if (response.data.success) {
        toast({ title: "Transfer Complete", description: "Database transaction successful" });
        onTransferSuccess();
        handleClose();
      }
    } catch (err: any) {
      toast({
        title: "Database Error",
        description: err.response?.data?.error || "Company or Member not found in database",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ fromMemberId: "", toMemberId: "", amount: "", date: new Date().toISOString().split('T')[0], notes: "" });
    onClose();
  };

  const sender = directors.find(d => d.id.toString() === formData.fromMemberId);
  const recipient = directors.find(d => d.id.toString() === formData.toMemberId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" /> Share Ledger Transfer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Shareholder</Label>
              <Select value={formData.fromMemberId} onValueChange={(v) => setFormData({...formData, fromMemberId: v})}>
                <SelectTrigger><SelectValue placeholder="Select sender" /></SelectTrigger>
                <SelectContent>
                  {directors.filter(d => parseFloat(d.shares_held || d.shares || '0') > 0).map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name} ({parseFloat(d.shares_held || d.shares).toLocaleString()} sh)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recipient Shareholder</Label>
              <Select value={formData.toMemberId} onValueChange={(v) => setFormData({...formData, toMemberId: v})}>
                <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                <SelectContent>
                  {directors.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name} ({parseFloat(d.shares_held || d.shares || '0').toLocaleString()} sh)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Impact Summary Section */}
          {validation.isValid && sender && recipient && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
              <p className="font-bold text-blue-800 mb-2 underline">Real-Time Database Impact Preview:</p>
              <div className="flex justify-between">
                <span>{sender.name} (Remaining):</span>
                <span className="font-mono font-bold text-red-600">
                  {(validation.availableShares - parseFloat(formData.amount)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{recipient.name} (New Balance):</span>
                <span className="font-mono font-bold text-green-600">
                  {(parseFloat(recipient.shares_held || recipient.shares || '0') + parseFloat(formData.amount)).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Form Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount to Transfer</Label>
              <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Transaction Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Reason for transfer" />
          </div>

          {validation.errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validation.errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={!validation.isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Execute Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
