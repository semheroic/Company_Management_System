import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import FixedAssetService from "@/services/fixedAssetService";
import UniversalTransactionService from "@/services/universalTransactionService";

interface FixedAssetFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

export function FixedAssetForm({ open, onClose, onSuccess }: FixedAssetFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    acquisitionDate: "",
    acquisitionCost: "",
    depreciationMethod: "straight_line" as const,
    usefulLifeYears: "",
    residualValue: "",
    location: "",
    supplier: "",
    status: "active" as const,
    useUTS: true,
    paymentMethod: "bank" as "cash" | "bank",
    includeVAT: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Computer Equipment",
    "Vehicle",
    "Furniture",
    "Machinery",
    "Building",
    "Land",
    "Office Equipment",
    "Tools",
  ];

  const locations = [
    "Main Office",
    "IT Department",
    "Administration",
    "Warehouse",
    "Production Floor",
    "Reception",
    "Conference Room",
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      acquisitionDate: "",
      acquisitionCost: "",
      depreciationMethod: "straight_line",
      usefulLifeYears: "",
      residualValue: "",
      location: "",
      supplier: "",
      status: "active",
      useUTS: true,
      paymentMethod: "bank",
      includeVAT: true,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !formData.name ||
      !formData.category ||
      !formData.acquisitionDate ||
      !formData.acquisitionCost ||
      !formData.usefulLifeYears
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const acquisitionCost = Number(formData.acquisitionCost);
      const totalAmount = formData.includeVAT ? acquisitionCost * 1.18 : acquisitionCost;
      const assetPayload = {
        name: formData.name,
        category: formData.category,
        acquisitionDate: formData.acquisitionDate,
        acquisitionCost,
        depreciationMethod: formData.depreciationMethod,
        usefulLifeYears: Number(formData.usefulLifeYears),
        residualValue: Number(formData.residualValue || 0),
        location: formData.location,
        supplier: formData.supplier,
        status: formData.status,
      };

      if (formData.useUTS) {
        const selectedCompanyId = localStorage.getItem("selectedCompanyId");
        if (!selectedCompanyId) {
          throw new Error("No company selected");
        }

        UniversalTransactionService.createTransaction({
          type: "asset_acquisition",
          amount: totalAmount,
          payment_method: formData.paymentMethod,
          description: `Asset Acquisition - ${formData.name}`,
          date: formData.acquisitionDate,
          supplier: formData.supplier,
          status: "confirmed",
          company_id: selectedCompanyId,
          asset_details: {
            name: formData.name,
            category: formData.category,
            location: formData.location,
            useful_life_years: Number(formData.usefulLifeYears),
            residual_value: Number(formData.residualValue || 0),
            depreciation_method: formData.depreciationMethod,
          },
        });
      }

      await FixedAssetService.addAsset(assetPayload);

      toast({
        title: "Success",
        description: formData.useUTS
          ? "Asset saved and accounting entries posted automatically."
          : "Fixed asset has been added successfully.",
      });

      resetForm();
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error("Fixed asset creation failed:", error);
      toast({
        title: "Save Failed",
        description: error?.response?.data?.error || "Failed to save the fixed asset.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Fixed Asset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 rounded-lg bg-blue-50 p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useUTS"
                checked={formData.useUTS}
                onCheckedChange={(checked) => handleInputChange("useUTS", checked as boolean)}
              />
              <Label htmlFor="useUTS" className="text-sm font-medium">
                Use Universal Transaction System
              </Label>
            </div>
            <p className="text-xs text-blue-700">
              This saves the fixed asset in the backend register and optionally posts the accounting entry.
            </p>

            {formData.useUTS && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="paymentMethod" className="text-sm">
                    Payment Method
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange("paymentMethod", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="includeVAT"
                    checked={formData.includeVAT}
                    onCheckedChange={(checked) => handleInputChange("includeVAT", checked as boolean)}
                  />
                  <Label htmlFor="includeVAT" className="text-sm">
                    Include VAT (18%)
                  </Label>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => handleInputChange("name", event.target.value)}
                placeholder="e.g. Dell Laptop - IT001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Acquisition Date *</Label>
              <Input
                id="acquisitionDate"
                type="date"
                value={formData.acquisitionDate}
                onChange={(event) => handleInputChange("acquisitionDate", event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionCost">
                {formData.useUTS && formData.includeVAT ? "Net Cost (RWF) *" : "Acquisition Cost (RWF) *"}
              </Label>
              <Input
                id="acquisitionCost"
                type="number"
                value={formData.acquisitionCost}
                onChange={(event) => handleInputChange("acquisitionCost", event.target.value)}
                placeholder="0"
                min="0"
                step="1"
                required
              />
              {formData.useUTS && formData.includeVAT && formData.acquisitionCost && (
                <p className="text-xs text-gray-600">
                  Total with VAT: {FixedAssetService.formatCurrency(Number(formData.acquisitionCost) * 1.18)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="usefulLifeYears">Useful Life (Years) *</Label>
              <Input
                id="usefulLifeYears"
                type="number"
                value={formData.usefulLifeYears}
                onChange={(event) => handleInputChange("usefulLifeYears", event.target.value)}
                placeholder="5"
                min="1"
                max="50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="residualValue">Residual Value (RWF)</Label>
              <Input
                id="residualValue"
                type="number"
                value={formData.residualValue}
                onChange={(event) => handleInputChange("residualValue", event.target.value)}
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(event) => handleInputChange("supplier", event.target.value)}
                placeholder="e.g. Dell Rwanda"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="depreciationMethod">Depreciation Method</Label>
            <Select
              value={formData.depreciationMethod}
              onValueChange={(value) => handleInputChange("depreciationMethod", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight_line">Straight Line</SelectItem>
                <SelectItem value="reducing_balance" disabled>
                  Reducing Balance (Coming Soon)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
