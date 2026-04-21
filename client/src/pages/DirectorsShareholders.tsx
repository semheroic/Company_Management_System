import { ArrowLeft, Plus, Edit, Trash, Users, TrendingUp, Building, ArrowRightLeft, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { DirectorShareholderForm } from "@/components/forms/DirectorShareholderForm";
import { ShareTransferForm } from "@/components/forms/ShareTransferForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButton } from "@/components/common/ExportButton";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Match frontend to your MariaDB schema
interface DirectorShareholder {
  id: number;
  name: string;
  nationalId: string; // mapped from national_id
  role: string;
  nationality: string;
  shares: string;      // mapped from shares_held
  joinDate: string;    // mapped from join_date
  status: string;
  document_path?: string; 
}

const AUTHORIZED_SHARES = 10000;
axios.defaults.baseURL = 'http://localhost:5000';

export default function DirectorsShareholders() {
  const { toast } = useToast();
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<DirectorShareholder | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [directors, setDirectors] = useState<DirectorShareholder[]>([]);

  const resolveCompanyId = useCallback(async () => {
    const storedId = localStorage.getItem("selectedCompanyId");

    try {
      const response = await axios.get("/api/companies");
      const companies = Array.isArray(response.data) ? response.data : [];

      if (companies.length === 0) {
        setCompanyId(null);
        return null;
      }

      const storedCompany = storedId
        ? companies.find((company: any) => String(company.id) === storedId)
        : null;

      const fallbackCompany = companies.find((company: any) => company.status === "active") || companies[0];
      const resolvedId = String((storedCompany || fallbackCompany).id);

      localStorage.setItem("selectedCompanyId", resolvedId);
      setCompanyId(resolvedId);
      return resolvedId;
    } catch (error) {
      console.error("Failed to resolve company ID:", error);
      setCompanyId(storedId);
      return storedId;
    }
  }, []);

  // 1. FETCH MEMBERS FROM DATABASE
  const fetchMembers = useCallback(async (targetCompanyId?: string | null) => {
    setIsLoading(true);
    const resolvedCompanyId = targetCompanyId || companyId;

    if (!resolvedCompanyId) {
      setDirectors([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`/api/company/${resolvedCompanyId}/members`, {
        headers: { "x-company-id": resolvedCompanyId }
      });
      // Map database snake_case to your existing frontend camelCase
      const mappedData = response.data.map((m: any) => ({
        id: m.id,
        name: m.name,
        nationalId: m.national_id,
        role: m.role,
        nationality: m.nationality,
        shares: m.shares_held.toString(),
        joinDate: m.join_date ? new Date(m.join_date).toISOString().split('T')[0] : "",
        status: m.status,
        document_path: m.document_path
      }));
      setDirectors(mappedData);
    } catch (error: any) {
      toast({
        title: "Fetch Failed",
        description: error.response?.data?.error || "Could not load members from database.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    const initializePage = async () => {
      const resolvedCompanyId = await resolveCompanyId();
      await fetchMembers(resolvedCompanyId);
    };

    void initializePage();
  }, [fetchMembers, resolveCompanyId]);

  // 2. ADD / UPDATE HANDLER (Called by Form)
  const handleFormSubmit = async () => {
    // The actual API call is handled inside DirectorShareholderForm 
    // based on our previous task. We just refresh the table here.
    await fetchMembers();
    handleFormClose();
  };

  // 3. DELETE MEMBER FROM DATABASE
  const handleDeletePerson = async (id: number) => {
    if (!companyId) {
      toast({ title: "No Company Selected", description: "Select or create a company first.", variant: "destructive" });
      return;
    }

    if (window.confirm("Are you sure you want to delete this person? This will be permanent in the database.")) {
      try {
        await axios.delete(`/api/company/${companyId}/members/${id}`, {
          headers: { "x-company-id": companyId }
        });
        toast({ title: "Success", description: "Member removed from database." });
        fetchMembers(); // Refresh table
      } catch (error) {
        toast({ title: "Delete Failed", description: "Could not remove member.", variant: "destructive" });
      }
    }
  };

  const handleEditPerson = (person: DirectorShareholder) => {
    setEditingPerson(person);
    setShowForm(true);
  };

  // Remaining Logic (Sync, Transfers, UI Calculations) kept exactly as provided
const handleShareTransferSuccess = async () => {
  await fetchMembers(); // Refresh the table data
  setShowTransferForm(false); // Close the modal
  toast({ title: "Success", description: "Shares transferred in database." });
};

  const handleManualSync = async () => {
    if (!companyId) {
      toast({ title: "No Company Selected", description: "Select or create a company first.", variant: "destructive" });
      return;
    }

    setIsSyncing(true);
    await fetchMembers();
    setIsSyncing(false);
    toast({ title: "Sync Complete", description: "Data refreshed from Port 5000" });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPerson(null);
  };

  const totalDirectors = directors.filter(d => d.role.toLowerCase().includes('director')).length;
  const totalShareholders = directors.filter(d => d.role.toLowerCase().includes('shareholder')).length;
  const totalShares = directors.reduce((sum, d) => sum + parseFloat(d.shares || '0'), 0);
  const availableShares = AUTHORIZED_SHARES - totalShares;
  const isOverAllocated = totalShares > AUTHORIZED_SHARES;
  const sharesPercentage = (totalShares / AUTHORIZED_SHARES) * 100;

  const exportColumns = [
    { key: 'name', label: 'Name' },
    { key: 'nationalId', label: 'National ID' },
    { key: 'role', label: 'Role' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'shares', label: 'Shares Held' },
    { key: 'joinDate', label: 'Join Date' },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold">Directors & Shareholders</h1>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {companyId ? `Company ID ${companyId}` : "No Company Selected"}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleManualSync} disabled={isSyncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing || isLoading ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Refresh Data'}
            </Button>
            <ExportButton 
              data={directors} 
              filename="directors-shareholders" 
              title="Directors & Shareholders Register"
              columns={exportColumns}
            />
            <Button variant="outline" onClick={() => setShowTransferForm(true)} disabled={!companyId || directors.length < 2}>
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transfer Shares
            </Button>
            <Button onClick={() => setShowForm(true)} disabled={!companyId}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Person
            </Button>
          </div>
        </div>

        {!companyId && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No active company is selected. Create or select a company before managing directors and shareholders.
            </AlertDescription>
          </Alert>
        )}

        {/* Share Allocation Alert */}
        {isOverAllocated && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Over-allocation detected!</strong> Total shares ({totalShares.toLocaleString()}) exceed limit.
            </AlertDescription>
          </Alert>
        )}

        {/* Share Summary Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{totalDirectors}</div>
                  <div className="text-sm text-gray-600">Total Directors</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{totalShareholders}</div>
                  <div className="text-sm text-gray-600">Total Shareholders</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <div className={`text-2xl font-bold ${isOverAllocated ? 'text-red-600' : 'text-green-600'}`}>
                    {totalShares.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Shares Allocated</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div>
                  <div className={`text-2xl font-bold ${availableShares < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {availableShares.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Available Shares</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Allocation Progress</span>
              <span className="text-sm text-gray-600">{sharesPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${isOverAllocated ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(sharesPercentage, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Directors & Shareholders (Database)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Shares Held</TableHead>
                  <TableHead>% Ownership</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-10">Loading members from database...</TableCell></TableRow>
                ) : directors.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-10">No members found for this company.</TableCell></TableRow>
                ) : (
                  directors.map((director) => {
                    const ownershipPercent = ((parseFloat(director.shares || '0') / AUTHORIZED_SHARES) * 100).toFixed(2);
                    return (
                      <TableRow key={director.id}>
                        <TableCell className="font-medium">{director.name}</TableCell>
                        <TableCell>{director.nationalId}</TableCell>
                        <TableCell>{director.role}</TableCell>
                        <TableCell>{director.nationality}</TableCell>
                        <TableCell><Badge variant="outline">{parseFloat(director.shares).toLocaleString()}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{ownershipPercent}%</Badge></TableCell>
                        <TableCell>{director.joinDate}</TableCell>
                        <TableCell>
                          <Badge className={director.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {director.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPerson(director)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeletePerson(director.id)}>
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <DirectorShareholderForm 
          open={showForm} 
          onClose={handleFormClose}
          onAdd={handleFormSubmit} // Now handles both add and update refresh
          companyId={companyId}
          editData={editingPerson}
          currentDirectors={directors}
          authorizedShares={AUTHORIZED_SHARES}
        />

        <ShareTransferForm
  open={showTransferForm}
  onClose={() => setShowTransferForm(false)}
  onTransferSuccess={handleShareTransferSuccess} 
  directors={directors}
  companyId={companyId} 
/>
      </div>
    </div>
  );
}
