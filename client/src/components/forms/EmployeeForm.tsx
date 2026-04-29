
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import EmployeeRecordsService, { EmployeeRecord } from "@/services/employeeRecordsService";

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (employee: EmployeeRecord) => void;
}

export function EmployeeForm({ open, onClose, onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    position: "",
    department: "",
    grossSalary: "",
    startDate: "",
    rssbNumber: "",
    contract: null as File | null
  });
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      nationalId: "",
      position: "",
      department: "",
      grossSalary: "",
      startDate: "",
      rssbNumber: "",
      contract: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const employee = await EmployeeRecordsService.create({
        fullName: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        nationalId: formData.nationalId,
        position: formData.position,
        department: formData.department,
        grossSalary: Number(formData.grossSalary || 0),
        startDate: formData.startDate,
        rssbNumber: formData.rssbNumber || undefined,
        contract: formData.contract,
      });

      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      onSuccess?.(employee);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to create employee:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the employee record.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, contract: e.target.files[0] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nationalId">National ID *</Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grossSalary">Gross Salary (RWF) *</Label>
              <Input
                id="grossSalary"
                type="number"
                min="0"
                value={formData.grossSalary}
                onChange={(e) => setFormData({ ...formData, grossSalary: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="rssbNumber">RSSB Number</Label>
              <Input
                id="rssbNumber"
                value={formData.rssbNumber}
                onChange={(e) => setFormData({ ...formData, rssbNumber: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contract">Employment Contract</Label>
            <Input
              id="contract"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add Employee"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
