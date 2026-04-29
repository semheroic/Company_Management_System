
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ComplianceAlertService, { ComplianceAlertRecord } from "@/services/complianceAlertService";
import AuthService from "@/services/authService";

interface ManualAlertFormProps {
  open: boolean;
  onClose: () => void;
  onAlertCreated: (alert: ComplianceAlertRecord) => void;
}

export default function ManualAlertForm({ open, onClose, onAlertCreated }: ManualAlertFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'custom' as const,
    severity: 'medium' as const,
    dueDate: '',
    actionRequired: '',
    forRole: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);

  const roles = [
    { id: 'admin', label: 'Administrator' },
    { id: 'hr', label: 'Human Resources' },
    { id: 'accountant', label: 'Accountant' },
    { id: 'legal', label: 'Legal' },
    { id: 'manager', label: 'Manager' }
  ];

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      forRole: checked 
        ? [...prev.forRole, roleId]
        : prev.forRole.filter(r => r !== roleId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.dueDate || formData.forRole.length === 0) {
      toast({
        title: "Missing Information",
        description: "Provide the alert details and at least one notified role.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const currentUser = AuthService.getUser();
      const alert = await ComplianceAlertService.create({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        severity: formData.severity,
        dueDate: formData.dueDate,
        forRole: formData.forRole,
        actionRequired: formData.actionRequired || undefined,
        createdBy: currentUser?.name || "Current User",
        source: "manual",
      });

      onAlertCreated(alert);
      onClose();
      setFormData({
        title: '',
        description: '',
        type: 'custom',
        severity: 'medium',
        dueDate: '',
        actionRequired: '',
        forRole: []
      });
    } catch (error) {
      console.error("Failed to create alert:", error);
      toast({
        title: "Save Failed",
        description: "Could not create the alert.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Manual Alert</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Alert Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter alert title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the alert"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Alert Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="actionRequired">Action Required</Label>
            <Input
              id="actionRequired"
              value={formData.actionRequired}
              onChange={(e) => setFormData(prev => ({ ...prev, actionRequired: e.target.value }))}
              placeholder="What action needs to be taken?"
            />
          </div>

          <div>
            <Label>Notify Roles *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.id}
                    checked={formData.forRole.includes(role.id)}
                    onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                  />
                  <Label htmlFor={role.id} className="text-sm">{role.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Alert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
