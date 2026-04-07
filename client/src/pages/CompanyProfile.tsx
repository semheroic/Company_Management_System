import { ArrowLeft, Upload, Edit, Save, Building2, FileText, Download, Trash2, Users, Settings, Globe, Phone, Mail, MapPin, Calendar, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CompanyProfileForm } from "@/components/forms/CompanyProfileForm";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function CompanyProfile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const selectedId = localStorage.getItem("selectedCompanyId");
    if (selectedId) {
      loadCompanyData(selectedId);
      loadDocuments(selectedId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadCompanyData = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/company/${id}`);
      if (response.data) setCompanyData(response.data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load company profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/api/company/${id}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Docs load error", error);
    }
  };

  const handleSave = async () => {
    if (!companyData) return;
    try {
      await axios.put(`${API_BASE}/api/company/${companyData.id}`, companyData);
      setIsEditing(false);
      toast({ title: "Success", description: "Company profile updated successfully" });
      loadCompanyData(companyData.id);
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.error || "Update failed", variant: "destructive" });
    }
  };

  const handleInputChange = (field, value) => {
    if (!companyData) return;
    setCompanyData({ ...companyData, [field]: value });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    const companyId = localStorage.getItem("selectedCompanyId");
    if (file && companyId) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "general");
      try {
        await axios.post(`${API_BASE}/api/company/${companyId}/upload`, formData);
        toast({ title: "Success", description: `${file.name} uploaded successfully` });
        loadDocuments(companyId);
      } catch (error) {
        toast({ title: "Upload Failed", description: "File upload failed", variant: "destructive" });
      }
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/document/${id}`);
      setDocuments(documents.filter(doc => doc.id !== id));
      toast({ title: "Success", description: "Document deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (!companyData) return <div className="p-6 text-center"><p>No Company Selected</p><Button onClick={() => window.location.href='/'}>Return Home</Button></div>;

  return (
    <div className="min-h-screen bg-background p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button></Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{companyData.name}</h1>
              <p className="text-muted-foreground font-mono text-sm">ID: {companyData.registration_number || 'UNREGISTERED'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 capitalize"><CheckCircle className="w-3 h-3" /> {companyData.status}</Badge>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="gap-2"><Edit className="w-4 h-4" /> Edit Profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700"><Save className="w-4 h-4" /> Save Changes</Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2"><Building2 className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="details" className="gap-2"><Settings className="w-4 h-4" /> Details</TabsTrigger>
            <TabsTrigger value="documents" className="gap-2"><FileText className="w-4 h-4" /> Documents</TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2"><Shield className="w-4 h-4" /> Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-md">
                <CardHeader><CardTitle className="flex items-center gap-2 text-blue-600"><Building2 className="w-5 h-5" /> Company Information</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Company Name *</Label><Input value={companyData.name} onChange={(e) => handleInputChange('name', e.target.value)} disabled={!isEditing} /></div>
                    <div className="space-y-1"><Label>TIN Number</Label><Input value={companyData.tin || ""} onChange={(e) => handleInputChange('tin', e.target.value)} disabled={!isEditing} /></div>
                    <div className="space-y-1"><Label>Registration Number</Label><Input value={companyData.registration_number || ""} onChange={(e) => handleInputChange('registration_number', e.target.value)} disabled={!isEditing} /></div>
                    <div className="space-y-1">
                      <Label>Currency</Label>
                      <Select value={companyData.currency} onValueChange={(v) => handleInputChange('currency', v)} disabled={!isEditing}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="RWF">RWF - Rwandan Franc</SelectItem><SelectItem value="USD">USD - US Dollar</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Business Sector</Label>
                      <Select value={companyData.sector || ""} onValueChange={(v) => handleInputChange('sector', v)} disabled={!isEditing}>
                        <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                        <SelectContent><SelectItem value="technology">Technology</SelectItem><SelectItem value="finance">Finance</SelectItem><SelectItem value="agriculture">Agriculture</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Company Size</Label>
                      <Select value={companyData.size || ""} onValueChange={(v) => handleInputChange('size', v)} disabled={!isEditing}>
                        <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                        <SelectContent><SelectItem value="small">Small (5-30 employees)</SelectItem><SelectItem value="medium">Medium (31-100 employees)</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Incorporation Date</Label><Input type="date" value={companyData.incorporation_date ? companyData.incorporation_date.split('T')[0] : ""} onChange={(e) => handleInputChange('incorporation_date', e.target.value)} disabled={!isEditing} /></div>
                    <div className="space-y-1"><Label>Fiscal Year Start</Label><Input value={companyData.fiscal_year_start || "01-01"} onChange={(e) => handleInputChange('fiscal_year_start', e.target.value)} disabled={!isEditing} className="font-mono" /></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white/50 backdrop-blur-md">
                <CardHeader><CardTitle className="flex items-center gap-2 text-blue-600"><Globe className="w-5 h-5" /> Contact Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1"><Label><Mail className="w-4 h-4 inline mr-2" /> Email</Label><Input value={companyData.email || ""} onChange={(e) => handleInputChange('email', e.target.value)} disabled={!isEditing} /></div>
                  <div className="space-y-1"><Label><Phone className="w-4 h-4 inline mr-2" /> Phone</Label><Input value={companyData.phone || ""} onChange={(e) => handleInputChange('phone', e.target.value)} disabled={!isEditing} /></div>
                  <div className="space-y-1"><Label><MapPin className="w-4 h-4 inline mr-2" /> Address</Label><Input value={companyData.address || ""} onChange={(e) => handleInputChange('address', e.target.value)} disabled={!isEditing} /></div>
                  <Separator />
                  <Badge variant="outline" className="w-full justify-center bg-blue-50/50 text-blue-700">{companyData.tax_regime || 'General'}</Badge>
                  <Badge variant={companyData.status === 'active' ? 'default' : 'secondary'} className={`w-full justify-center ${companyData.status === 'active' ? 'bg-green-600' : ''}`}>{companyData.status?.toUpperCase() || 'PENDING'}</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rest of Tabs preserved exactly */}
          <TabsContent value="details" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle>System Audit Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Created Date</Label><Input value={new Date(companyData.created_at).toLocaleString()} disabled className="bg-gray-50 font-mono" /></div>
                <div className="space-y-1"><Label>Last System Update</Label><Input value={new Date(companyData.updated_at).toLocaleString()} disabled className="bg-gray-50 font-mono" /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-blue-600" /> Upload Documents</CardTitle></CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50/50">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>Choose Files</Button>
                    <input id="file-upload" type="file" onChange={handleFileUpload} className="hidden" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Document Library</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-blue-600" /><div><p className="text-sm font-medium">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.size}</p></div></div>
                      <div className="flex gap-2"><Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-green-600" /> Compliance Status</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50/50 border rounded-lg">
                    <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-medium">Tax Registration</span></div>
                    <Badge className="bg-green-100 text-green-800">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border rounded-lg">
                    <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-yellow-600" /><span className="font-medium">Annual Returns</span></div>
                    <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* RESTORED QUICK ACTIONS */}
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600 transition-all"><Users className="w-4 h-4" /> Manage Directors & Shareholders</Button>
                  <Button variant="outline" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600 transition-all"><FileText className="w-4 h-4" /> Generate Compliance Report</Button>
                  <Button variant="outline" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600 transition-all"><Calendar className="w-4 h-4" /> View Compliance Calendar</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}