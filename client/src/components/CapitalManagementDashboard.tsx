import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Building, Users, DollarSign, Shield, 
  AlertTriangle, TrendingUp, Loader2, History, Trash2 
} from "lucide-react";
import { CompanyCapitalForm } from "@/components/forms/CompanyCapitalForm";
import { BeneficialOwnerForm } from "@/components/forms/BeneficialOwnerForm";
import { useToast } from "@/hooks/use-toast";
import { COMPANY_BASE_URL } from "@/services/companyApi";

interface CapitalManagementDashboardProps {
  companyId?: string;
}

export function CapitalManagementDashboard({ companyId: companyIdProp }: CapitalManagementDashboardProps) {
  const { toast } = useToast();
  const { id: routeId } = useParams<{ id: string }>();
  
  const companyId = companyIdProp || routeId || localStorage.getItem('selectedCompanyId') || "";

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [showCapitalForm, setShowCapitalForm] = useState(false);
  const [showBOForm, setShowBOForm] = useState(false);
  
  // Data State
  const [capitalData, setCapitalData] = useState<any>(null);
  const [shareholders, setShareholders] = useState([]);
  const [beneficialOwners, setBeneficialOwners] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);

  useEffect(() => {
    if (companyId) {
      loadDashboardData();
      return;
    }

    setIsLoading(false);
  }, [companyId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const headers = { "x-company-id": companyId };
    const baseUrl = COMPANY_BASE_URL;

    try {
      // Parallel requests to all relevant endpoints provided in your backend
      const [capitalRes, boRes, shareholdersRes, historyRes] = await Promise.all([
        axios.get(`${baseUrl}/${companyId}/capital`, { headers }),
        axios.get(`${baseUrl}/${companyId}/beneficial-owners`, { headers }),
        axios.get(`${baseUrl}/${companyId}/shareholders`, { headers }),
        axios.get(`${baseUrl}/${companyId}/shares/history`, { headers })
      ]);

      setCapitalData(capitalRes.data);
      setBeneficialOwners(boRes.data);
      setShareholders(shareholdersRes.data);
      setTransferHistory(historyRes.data);
    } catch (error: any) {
      console.error("Dashboard Load Error:", error);
      
      // If capital structure hasn't been created yet (404), set to null to trigger setup alert
      if (error.response?.status === 404) {
        setCapitalData(null);
      } else {
        toast({
          title: "Fetch Failed",
          description: "Could not load management data. Check your connection.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBO = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this beneficial owner?")) return;

    try {
      await axios.delete(`${COMPANY_BASE_URL}/${companyId}/beneficial-owners/${id}`, {
        headers: { "x-company-id": companyId }
      });
      toast({ title: "Success", description: "Owner removed successfully" });
      loadDashboardData(); // Refresh all data
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete record", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Registry Data...</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Select a company first to load capital and ownership data.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Capital & Ownership</h1>
          <p className="text-muted-foreground">Manage authorized shares, shareholders, and regulatory beneficial ownership.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCapitalForm(true)} variant="outline">
            <Shield className="w-4 h-4 mr-2" /> Configure Capital
          </Button>
          <Button onClick={() => setShowBOForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Beneficial Owner
          </Button>
        </div>
      </div>

      {/* Capital Structure Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{capitalData?.authorized_shares?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground uppercase">Authorized Shares</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{capitalData?.issued_shares?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground uppercase">Issued Shares</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {capitalData?.paid_up_capital?.toLocaleString() || '0'} 
                <span className="text-sm ml-1 text-muted-foreground">{capitalData?.currency || 'RWF'}</span>
              </div>
              <p className="text-xs text-muted-foreground uppercase">Paid-up Capital</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{beneficialOwners.length}</div>
              <p className="text-xs text-muted-foreground uppercase">B. Owners Listed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logic for Missing Capital Setup */}
      {!capitalData?.authorized_shares && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ml-2">
            <span className="font-medium text-red-800">
              The capital structure for this company has not been initialized.
            </span>
            <Button size="sm" variant="destructive" onClick={() => setShowCapitalForm(true)}>
              Initialize Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Management Tabs */}
      <Tabs defaultValue="shareholders" className="w-full">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="shareholders" className="flex gap-2">
            <Users className="w-4 h-4" /> Shareholders
          </TabsTrigger>
          <TabsTrigger value="beneficial-owners" className="flex gap-2">
            <Shield className="w-4 h-4" /> Beneficial Owners
          </TabsTrigger>
          <TabsTrigger value="history" className="flex gap-2">
            <History className="w-4 h-4" /> Transfer History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shareholders" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Legal Name</TableHead>
                  <TableHead>Shares Held</TableHead>
                  <TableHead>Ownership (%)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareholders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No active shareholders found in the registry.
                    </TableCell>
                  </TableRow>
                ) : (
                  shareholders.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.shares_count?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{Number(s.ownership_percent).toFixed(2)}%</span>
                          <div className="w-24 h-2 bg-gray-100 rounded-full hidden sm:block">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${s.ownership_percent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
                          Verified
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="beneficial-owners" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner Name</TableHead>
                  <TableHead className="hidden md:table-cell">ID/Passport</TableHead>
                  <TableHead>Stake</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficialOwners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No Beneficial Owners declared. Compliance requires listing all owners {" > "}25%.
                    </TableCell>
                  </TableRow>
                ) : (
                  beneficialOwners.map((bo: any) => (
                    <TableRow key={bo.id}>
                      <TableCell className="font-medium">
                        {bo.full_name}
                        <div className="md:hidden text-xs text-muted-foreground">{bo.id_number}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono hidden md:table-cell">
                        {bo.id_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                          {bo.ownership_percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {bo.relationship_to_company?.replace(/_/g, ' ') || 'Direct Owner'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteBO(bo.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No share transfers recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transferHistory.map((th: any) => (
                    <TableRow key={th.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(th.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">{th.from_member_name || 'Initial Issue'}</TableCell>
                      <TableCell className="text-green-600 font-medium">{th.to_member_name}</TableCell>
                      <TableCell className="font-mono font-bold">
                        {th.shares_amount?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {th.notes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms Overlay */}
      <CompanyCapitalForm 
        open={showCapitalForm} 
        onClose={() => setShowCapitalForm(false)} 
        onSuccess={loadDashboardData} 
      />
      
      <BeneficialOwnerForm 
        open={showBOForm} 
        onClose={() => setShowBOForm(false)} 
        onAdd={loadDashboardData} 
      />
    </div>
  );
}
