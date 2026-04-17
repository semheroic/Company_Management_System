import { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck } from "lucide-react";

interface BeneficialOwnerFormProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void; 
}

export function BeneficialOwnerForm({ open, onClose, onAdd }: BeneficialOwnerFormProps) {
  const { toast } = useToast();
  const { id: routeId } = useParams<{ id: string }>();
  
  const companyId = routeId || localStorage.getItem('selectedCompanyId') || "9";

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State keys updated to match your SPECIFIC database columns
  const [formData, setFormData] = useState({
    full_name: "",
    nationality: "",
    id_number: "", // Changed from national_id to match your DB
    relationship_to_company: "direct_owner", // Added because DB says NO NULL
    ownership_percentage: "",
    physical_address: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Map exactly to your DB field list
      const payload = {
        full_name: formData.full_name,
        nationality: formData.nationality,
        id_number: formData.id_number,
        relationship_to_company: formData.relationship_to_company,
        ownership_percentage: parseFloat(formData.ownership_percentage) || 0,
        physical_address: formData.physical_address,
        company_id: parseInt(companyId)
      };

      const response = await axios.post(
        `http://localhost:5000/api/company/${companyId}/beneficial-owners`,
        payload,
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
          description: "Beneficial owner registered successfully."
        });
        
        // Reset form
        setFormData({ 
          full_name: "", 
          nationality: "", 
          id_number: "", 
          relationship_to_company: "direct_owner",
          ownership_percentage: "", 
          physical_address: "" 
        });
        onAdd(); 
        onClose();
      }
    } catch (error: any) {
      console.error("Submission Error:", error);
      toast({
        title: "Database Error",
        description: error.response?.data?.error || "Unknown column error. Check backend console.",
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
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Add Beneficial Owner
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="id_number">National ID/Passport (id_number) *</Label>
            <Input
              id="id_number"
              value={formData.id_number}
              onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownership_percentage">Ownership %</Label>
              <Input
                id="ownership_percentage"
                type="number"
                step="0.01"
                value={formData.ownership_percentage}
                onChange={(e) => setFormData({ ...formData, ownership_percentage: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality *</Label>
              <Input
                id="nationality"
                placeholder="e.g. Rwandan"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship Type *</Label>
            <Select 
              value={formData.relationship_to_company} 
              onValueChange={(value) => setFormData({ ...formData, relationship_to_company: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct_owner">Direct Owner</SelectItem>
                <SelectItem value="indirect_owner">Indirect Owner</SelectItem>
                <SelectItem value="ultimate_controller">Ultimate Controller</SelectItem>
                <SelectItem value="nominee_beneficiary">Nominee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="physical_address">Physical Address</Label>
            <Input
              id="physical_address"
              value={formData.physical_address}
              onChange={(e) => setFormData({ ...formData, physical_address: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Add Owner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}