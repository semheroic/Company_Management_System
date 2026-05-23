import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Download,
  Edit,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { resolveAssetUrl } from "@/lib/api";
import { API_BASE } from "@/services/companyApi";
import type { Company } from "@/services/companyService";

interface CompanyDocument {
  id: number;
  name: string;
  size?: string | null;
  file_path?: string | null;
  created_at?: string;
}

const COMPANY_FIELDS: Array<keyof Company> = [
  "name",
  "tin",
  "registration_number",
  "currency",
  "sector",
  "size",
  "incorporation_date",
  "fiscal_year_start",
  "email",
  "phone",
  "address",
  "tax_regime",
  "country",
];

export default function CompanyProfile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const selectedId = localStorage.getItem("selectedCompanyId");
    if (selectedId) {
      void loadCompanyData(selectedId);
      void loadDocuments(selectedId);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedLogoFile) {
      setLogoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedLogoFile);
    setLogoPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedLogoFile]);

  const loadCompanyData = async (id: string | number) => {
    try {
      setLoading(true);
      const response = await axios.get<Company>(`${API_BASE}/api/company/${id}`, {
        headers: { "x-company-id": String(id) },
      });
      if (response.data) {
        setCompanyData(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load company profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (id: string | number) => {
    try {
      const response = await axios.get<CompanyDocument[]>(`${API_BASE}/api/company/${id}/documents`, {
        headers: { "x-company-id": String(id) },
      });
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Docs load error", error);
    }
  };

  const handleSave = async () => {
    if (!companyData) return;

    try {
      const payload = new FormData();

      COMPANY_FIELDS.forEach((field) => {
        const value = companyData[field];
        payload.append(field, value === null || value === undefined ? "" : String(value));
      });

      if (selectedLogoFile) {
        payload.append("logo", selectedLogoFile);
      }

      const response = await axios.put<Company>(
        `${API_BASE}/api/company/${companyData.id}`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-company-id": String(companyData.id),
          },
        },
      );

      setCompanyData(response.data);
      setSelectedLogoFile(null);
      setIsEditing(false);
      toast({ title: "Success", description: "Company profile updated successfully." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Update failed.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = async () => {
    if (companyData?.id) {
      await loadCompanyData(companyData.id);
    }
    setSelectedLogoFile(null);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof Company, value: string) => {
    if (!companyData) return;
    setCompanyData({ ...companyData, [field]: value });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const companyId = localStorage.getItem("selectedCompanyId");
    if (file && companyId) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "general");
      try {
        await axios.post(`${API_BASE}/api/company/${companyId}/upload`, formData, {
          headers: { "x-company-id": companyId },
        });
        toast({ title: "Success", description: `${file.name} uploaded successfully.` });
        await loadDocuments(companyId);
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "File upload failed.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      const companyId = localStorage.getItem("selectedCompanyId");
      if (!companyId) {
        throw new Error("No company selected");
      }

      await axios.delete(`${API_BASE}/api/company/${companyId}/documents/${id}`, {
        headers: { "x-company-id": companyId },
      });
      setDocuments((current) => current.filter((doc) => doc.id !== id));
      toast({ title: "Success", description: "Document deleted." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Delete failed.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = (document: CompanyDocument) => {
    const targetUrl = resolveAssetUrl(document.file_path);
    if (!targetUrl) {
      toast({
        title: "Unavailable",
        description: "This document does not have a downloadable file path.",
        variant: "destructive",
      });
      return;
    }

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!companyData) {
    return (
      <div className="p-6 text-center">
        <p>No Company Selected</p>
        <Button onClick={() => (window.location.href = "/")}>Return Home</Button>
      </div>
    );
  }

  const displayedLogoUrl = logoPreviewUrl || resolveAssetUrl(companyData.logo_url);

  return (
    <div className="min-h-screen bg-background p-6 font-sans">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border bg-slate-100">
                {displayedLogoUrl ? (
                  <img src={displayedLogoUrl} alt={companyData.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-slate-500" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{companyData.name}</h1>
                <p className="text-sm font-mono text-muted-foreground">
                  ID: {companyData.registration_number || "UNREGISTERED"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 capitalize">
              <CheckCircle className="h-3 w-3" /> {companyData.status}
            </Badge>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void handleCancelEdit()}>
                  Cancel
                </Button>
                <Button onClick={() => void handleSave()} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <Building2 className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <Settings className="h-4 w-4" /> Details
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" /> Documents
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <Shield className="h-4 w-4" /> Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="border-none bg-white/50 shadow-sm backdrop-blur-md lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Building2 className="h-5 w-5" /> Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Company Name *</Label>
                      <Input
                        value={companyData.name}
                        onChange={(event) => handleInputChange("name", event.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>TIN Number</Label>
                      <Input
                        value={companyData.tin || ""}
                        onChange={(event) => handleInputChange("tin", event.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Registration Number</Label>
                      <Input
                        value={companyData.registration_number || ""}
                        onChange={(event) => handleInputChange("registration_number", event.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Currency</Label>
                      <Select
                        value={companyData.currency || "RWF"}
                        onValueChange={(value) => handleInputChange("currency", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Business Sector</Label>
                      <Select
                        value={companyData.sector || ""}
                        onValueChange={(value) => handleInputChange("sector", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Company Size</Label>
                      <Select
                        value={companyData.size || ""}
                        onValueChange={(value) => handleInputChange("size", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="micro">Micro (1-10 employees)</SelectItem>
                          <SelectItem value="small">Small (11-50 employees)</SelectItem>
                          <SelectItem value="medium">Medium (51-100 employees)</SelectItem>
                          <SelectItem value="large">Large (100+ employees)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Incorporation Date</Label>
                      <Input
                        type="date"
                        value={companyData.incorporation_date ? companyData.incorporation_date.split("T")[0] : ""}
                        onChange={(event) => handleInputChange("incorporation_date", event.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fiscal Year Start</Label>
                      <Input
                        value={companyData.fiscal_year_start || "01-01"}
                        onChange={(event) => handleInputChange("fiscal_year_start", event.target.value)}
                        disabled={!isEditing}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-white/50 shadow-sm backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Globe className="h-5 w-5" /> Branding & Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-dashed bg-slate-50 p-4 text-center">
                    <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-sm">
                      {displayedLogoUrl ? (
                        <img src={displayedLogoUrl} alt={companyData.name} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      {selectedLogoFile ? selectedLogoFile.name : companyData.logo_url ? "Current company logo" : "No logo uploaded yet"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isEditing ? "Upload a new image to replace the current logo." : "Enable editing to change the company logo."}
                    </p>
                    {isEditing && (
                      <div className="mt-4 space-y-2 text-left">
                        <Label htmlFor="company-logo">Company Logo</Label>
                        <Input
                          id="company-logo"
                          type="file"
                          accept="image/*"
                          className="cursor-pointer"
                          onChange={(event) => setSelectedLogoFile(event.target.files?.[0] || null)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>
                      <Mail className="mr-2 inline h-4 w-4" /> Email
                    </Label>
                    <Input
                      value={companyData.email || ""}
                      onChange={(event) => handleInputChange("email", event.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      <Phone className="mr-2 inline h-4 w-4" /> Phone
                    </Label>
                    <Input
                      value={companyData.phone || ""}
                      onChange={(event) => handleInputChange("phone", event.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      <MapPin className="mr-2 inline h-4 w-4" /> Address
                    </Label>
                    <Input
                      value={companyData.address || ""}
                      onChange={(event) => handleInputChange("address", event.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <Separator />
                  <Badge variant="outline" className="w-full justify-center bg-blue-50/50 text-blue-700">
                    {companyData.tax_regime || "General"}
                  </Badge>
                  <Badge
                    variant={companyData.status === "active" ? "default" : "secondary"}
                    className={`w-full justify-center ${companyData.status === "active" ? "bg-green-600" : ""}`}
                  >
                    {companyData.status?.toUpperCase() || "PENDING"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>System Audit Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Created Date</Label>
                  <Input
                    value={companyData.created_at ? new Date(companyData.created_at).toLocaleString() : ""}
                    disabled
                    className="bg-gray-50 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Last System Update</Label>
                  <Input
                    value={companyData.updated_at ? new Date(companyData.updated_at).toLocaleString() : ""}
                    disabled
                    className="bg-gray-50 font-mono"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" /> Upload Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border-2 border-dashed bg-gray-50/50 p-8 text-center">
                    <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                      Choose Files
                    </Button>
                    <input id="file-upload" type="file" onChange={handleFileUpload} className="hidden" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" /> Document Library
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.size || "Stored in company vault"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDeleteDocument(doc.id)}
                          className="text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" /> Compliance Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border bg-green-50/50 p-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Tax Registration</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-yellow-50 p-3">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">Annual Returns</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2 transition-all hover:bg-blue-50 hover:text-blue-600">
                    <Users className="h-4 w-4" /> Manage Directors & Shareholders
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 transition-all hover:bg-blue-50 hover:text-blue-600">
                    <FileText className="h-4 w-4" /> Generate Compliance Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 transition-all hover:bg-blue-50 hover:text-blue-600">
                    <Calendar className="h-4 w-4" /> View Compliance Calendar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
