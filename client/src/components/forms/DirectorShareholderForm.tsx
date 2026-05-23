import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { COMPANY_BASE_URL } from "@/services/companyApi";

interface DirectorShareholderFormProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  companyId: string | null;
  editData?: any;
  currentDirectors?: any[];
  authorizedShares?: number;
}

export function DirectorShareholderForm({ 
  open, 
  onClose, 
  onAdd, 
  companyId,
  editData, 
  currentDirectors = [],
  authorizedShares = 10000 
}: DirectorShareholderFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    role: "",
    ownershipPercent: "",
    nationality: "",
    status: "Active", // New field for status updates
    document: null as File | null
  });

  const [shareValidation, setShareValidation] = useState({
    currentTotal: 0,
    newTotal: 0,
    isValid: true,
    availableShares: 0
  });

  useEffect(() => {
    if (editData && open) {
      setFormData({
        fullName: editData.name || "",
        nationalId: editData.national_id || editData.nationalId || "",
        role: editData.role || "",
        ownershipPercent: editData.shares_held || editData.shares || "",
        nationality: editData.nationality || "",
        status: editData.status || "Active",
        document: null
      });
    } else if (open) {
      setFormData({
        fullName: "",
        nationalId: "",
        role: "",
        ownershipPercent: "",
        nationality: "",
        status: "Active",
        document: null
      });
    }
  }, [editData, open]);

  useEffect(() => {
    const currentTotal = currentDirectors
      .filter(d => !editData || d.id !== editData.id)
      .reduce((sum, d) => sum + parseFloat(d.shares_held || d.shares || '0'), 0);
    
    const newShares = parseFloat(formData.ownershipPercent || '0');
    const newTotal = currentTotal + newShares;
    const availableShares = authorizedShares - currentTotal;
    
    setShareValidation({
      currentTotal,
      newTotal,
      isValid: newTotal <= authorizedShares,
      availableShares
    });
  }, [formData.ownershipPercent, currentDirectors, editData, authorizedShares]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.nationalId.trim() || !formData.role || !formData.nationality) {
      toast({ title: "Validation Error", description: "All required fields must be filled", variant: "destructive" });
      return;
    }
    if (!formData.ownershipPercent || parseFloat(formData.ownershipPercent) <= 0) {
      toast({ title: "Validation Error", description: "Valid ownership percentage is required", variant: "destructive" });
      return;
    }
    if (!shareValidation.isValid) {
      toast({ title: "Share Allocation Error", description: `Total shares would exceed limit`, variant: "destructive" });
      return;
    }
    if (!companyId) {
      toast({ title: "No Company Selected", description: "Select or create a company first.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("name", formData.fullName);
      data.append("national_id", formData.nationalId);
      data.append("role", formData.role);
      data.append("nationality", formData.nationality);
      data.append("shares_held", formData.ownershipPercent);
      data.append("status", formData.status);
      
      const existingJoinDate = editData?.join_date || editData?.joinDate;
      const dateToSave = existingJoinDate || new Date().toLocaleDateString('en-CA');
      data.append("join_date", dateToSave);
      
      if (formData.document) {
        data.append("file", formData.document);
      }

      let response;
      const url = `${COMPANY_BASE_URL}/${companyId}/members`;
      
      if (editData && editData.id) {
        response = await axios.put(`${url}/${editData.id}`, data, {
          headers: { "Content-Type": "multipart/form-data", "x-company-id": companyId }
        });
      } else {
        response = await axios.post(url, data, {
          headers: { "Content-Type": "multipart/form-data", "x-company-id": companyId }
        });
      }

      if (response.data.success || response.status === 200 || response.status === 201) {
        toast({ 
          title: "Success", 
          description: editData ? "Member profile updated successfully" : "New member added successfully" 
        });
        onAdd(formData);
        handleClose();
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      toast({
        title: "Database Error",
        description: err.response?.data?.error || "Connection to backend failed.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: "", nationalId: "", role: "",
      ownershipPercent: "", nationality: "",
      status: "Active", document: null
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Member Profile" : "Add New Member"}</DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
          <div className="grid grid-cols-2 gap-y-2">
            <span className="text-gray-600">Authorized: <strong>{authorizedShares.toLocaleString()}</strong></span>
            <span className="text-gray-600">Available: <strong className="text-green-600">{shareValidation.availableShares.toLocaleString()}</strong></span>
            <span className="text-gray-600 col-span-2">Projected Total: <strong className={shareValidation.isValid ? 'text-blue-600' : 'text-red-600'}>{shareValidation.newTotal.toLocaleString()}</strong></span>
          </div>
        </div>

        {!shareValidation.isValid && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>This allocation exceeds the authorized limit.</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID/Passport *</Label>
              <Input id="nationalId" value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="Shareholder">Shareholder</SelectItem>
                  <SelectItem value="Director & Shareholder">Director & Shareholder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownershipPercent">Number of Shares *</Label>
              <Input id="ownershipPercent" type="number" value={formData.ownershipPercent} onChange={(e) => setFormData({ ...formData, ownershipPercent: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality *</Label>
              <Select value={formData.nationality} onValueChange={(v) => setFormData({ ...formData, nationality: v })}>
                <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rwandan">Rwandan</SelectItem>
                  <SelectItem value="Kenyan">Kenyan</SelectItem>
                  <SelectItem value="Ugandan">Ugandan</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Status Field - Only shows when editing or for explicit control */}
            <div className="space-y-2">
              <Label htmlFor="status">Member Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Supporting Document</Label>
            <Input id="document" type="file" accept=".pdf,.jpg,.png" onChange={(e) => e.target.files?.[0] && setFormData({ ...formData, document: e.target.files[0] })} />
            {editData?.document_path && !formData.document && <p className="text-xs text-blue-500">Document exists. Upload to replace.</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={!shareValidation.isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editData ? "Save Changes" : "Confirm Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
