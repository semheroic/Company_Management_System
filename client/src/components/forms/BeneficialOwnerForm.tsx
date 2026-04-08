import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck } from "lucide-react"; // Added icons
import axios from "axios";
import { useParams } from "react-router-dom";

interface BeneficialOwnerFormProps {
  open: boolean;
  onClose: () => void;
  onAdd: (record: any) => void;
}

export function BeneficialOwnerForm({ open, onClose, onAdd }: BeneficialOwnerFormProps) {
  const { toast } = useToast();
  const { companyId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    ownership: "",
    nationality: "",
    address: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.nationalId || !formData.ownership) {
      toast({
        title: "Required Fields",
        description: "Please ensure Name, ID, and Ownership % are provided.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const BASE_URL = "http://localhost:5000";
      // Use companyId from URL params or fallback to local storage
      const activeCompanyId = companyId || localStorage.getItem('selectedCompanyId');
      
      const payload = {
        company_id: activeCompanyId,
        full_name: formData.name,
        national_id: formData.nationalId,
        ownership_percentage: parseFloat(formData.ownership),
        nationality: formData.nationality,
        physical_address: formData.address
      };

      // API Call to Table 8 Backend
      const response = await axios.post(
        `${BASE_URL}/api/company/${activeCompanyId}/beneficial-owners`, 
        payload
      );

      if (response.data.success) {
        // Pass the new record (including the DB-generated ID) back to the parent UI
        const newRecord = {
          ...payload,
          id: response.data.ownerId || Date.now(),
        };
        
        onAdd(newRecord);
        
        toast({
          title: "Success",
          description: "Beneficial owner successfully registered in the system."
        });
        
        // Reset and close
        setFormData({ name: "", nationalId: "", ownership: "", nationality: "", address: "" });
        onClose();
      }
    } catch (error: any) {
      console.error("Error adding owner:", error);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "Could not connect to the server at localhost:5000",
        variant: "destructive"
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
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Jean Pierre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID/Passport *</Label>
            <Input
              id="nationalId"
              placeholder="ID Number"
              value={formData.nationalId}
              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownership">Ownership % *</Label>
              <Input
                id="ownership"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="25"
                value={formData.ownership}
                onChange={(e) => setFormData({ ...formData, ownership: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality *</Label>
              <Select 
                value={formData.nationality} 
                onValueChange={(value) => setFormData({ ...formData, nationality: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rwandan">🇷🇼 Rwandan</SelectItem>
                  <SelectItem value="kenyan">🇰🇪 Kenyan</SelectItem>
                  <SelectItem value="ugandan">🇺🇬 Ugandan</SelectItem>
                  <SelectItem value="tanzanian">🇹🇿 Tanzanian</SelectItem>
                  <SelectItem value="other">🌍 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Physical Address *</Label>
            <Input
              id="address"
              placeholder="District, Sector, Cell"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
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
                "Add Owner"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}