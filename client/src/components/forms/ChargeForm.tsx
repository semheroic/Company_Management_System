import { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ChargeFormProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void; // Trigger for parent refresh
}

export function ChargeForm({ open, onClose, onAdd }: ChargeFormProps) {
  const { toast } = useToast();
  const { id: routeId } = useParams<{ id: string }>();
  
  // Consistency with your other working components
  const companyId = routeId || localStorage.getItem('selectedCompanyId') || "9";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    charge_type: "",
    amount_display: "",
    creditor_name: "",
    registration_date: "",
    status: "Active"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/company/${companyId}/charges`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": companyId,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast({
          title: "Success",
          description: "Charge record has been officially registered."
        });
        
        // Reset form and sync parent UI
        setFormData({ 
          charge_type: "", 
          amount_display: "", 
          creditor_name: "", 
          registration_date: "", 
          status: "Active" 
        });
        onAdd();
        onClose();
      }
    } catch (error: any) {
      console.error("Submission Error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save the charge record.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Charge/Mortgage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="charge_type">Type *</Label>
            <Select 
              value={formData.charge_type} 
              onValueChange={(value) => setFormData({ ...formData, charge_type: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Loan">Bank Loan</SelectItem>
                <SelectItem value="Mortgage">Mortgage</SelectItem>
                <SelectItem value="Debenture">Debenture</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount_display">Amount *</Label>
            <Input
              id="amount_display"
              placeholder="e.g. 50,000,000 RWF"
              value={formData.amount_display}
              onChange={(e) => setFormData({ ...formData, amount_display: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="creditor_name">Creditor *</Label>
            <Input
              id="creditor_name"
              placeholder="Enter bank or individual name"
              value={formData.creditor_name}
              onChange={(e) => setFormData({ ...formData, creditor_name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="registration_date">Registration Date *</Label>
            <Input
              id="registration_date"
              type="date"
              value={formData.registration_date}
              onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Defaulted">Defaulted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Add Record"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}