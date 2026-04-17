import { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ShareCertificateFormProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void; // Changed to a refresh trigger
}

export function ShareCertificateForm({ open, onClose, onAdd }: ShareCertificateFormProps) {
  const { toast } = useToast();
  const { id: routeId } = useParams<{ id: string }>();
  
  // Use the ID from the URL, or fallback to the session ID like in your working component
  const companyId = routeId || localStorage.getItem('selectedCompanyId') || "9";

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State keys updated to match your MariaDB schema (snake_case)
  const [formData, setFormData] = useState({
    certificate_no: "",
    holder_name: "",
    shares_count: "",
    issue_date: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Ensure shares_count is a number for the database
      const payload = {
        ...formData,
        shares_count: parseInt(formData.shares_count, 10)
      };

      const response = await axios.post(
        `http://localhost:5000/api/company/${companyId}/certificates`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": companyId, // Required by your validateCompany middleware
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast({
          title: "Success",
          description: "Share certificate registered successfully."
        });
        
        // Reset form and refresh the parent list
        setFormData({ 
          certificate_no: "", 
          holder_name: "", 
          shares_count: "", 
          issue_date: "" 
        });
        onAdd(); 
        onClose();
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.error || "Could not save to database.",
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
          <DialogTitle>Add Share Certificate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="certificate_no">Certificate Number *</Label>
            <Input
              id="certificate_no"
              placeholder="e.g., CERT-001"
              value={formData.certificate_no}
              onChange={(e) => setFormData({ ...formData, certificate_no: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="holder_name">Shareholder Name *</Label>
            <Input
              id="holder_name"
              placeholder="Enter full name"
              value={formData.holder_name}
              onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="shares_count">Number of Shares *</Label>
            <Input
              id="shares_count"
              type="number"
              placeholder="0"
              value={formData.shares_count}
              onChange={(e) => setFormData({ ...formData, shares_count: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="issue_date">Issue Date *</Label>
            <Input
              id="issue_date"
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              required
              disabled={isSubmitting}
            />
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
                  Saving...
                </>
              ) : (
                "Add Certificate"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}