import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Download, Settings, Building, Users, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { CapitalEntryForm } from "@/components/forms/CapitalEntryForm";
import { CompanyCapitalForm } from "@/components/forms/CompanyCapitalForm";
import { EnhancedBeneficialOwnerForm } from "@/components/forms/EnhancedBeneficialOwnerForm";
import { ROISimulator } from "@/components/roi/ROISimulator";
import { MultiCurrencyManager } from "@/components/capital/MultiCurrencyManager";
import { CapitalLockingSystem } from "@/components/capital/CapitalLockingSystem";
import { EnhancedKPIDashboard } from "@/components/analytics/EnhancedKPIDashboard";
import CapitalService, { CapitalEntry, CapitalSummary } from "@/services/capitalService";
import CompanyCapitalService, { CompanyCapital, ShareholderRecord } from "@/services/companyCapitalService";
import BeneficialOwnerService, { BeneficialOwner } from "@/services/beneficialOwnerService";

interface BOValidation {
  isValid: boolean;
  totalPercentage: number;
  violations: string[];
}

export default function CapitalEquity() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showCapitalForm, setShowCapitalForm] = useState(false);
  const [showBOForm, setShowBOForm] = useState(false);
  const [editingBO, setEditingBO] = useState<BeneficialOwner | null>(null);
  const [capitalEntries, setCapitalEntries] = useState<CapitalEntry[]>([]);
  const [capitalSummary, setCapitalSummary] = useState<CapitalSummary | null>(null);
  const [companyCapital, setCompanyCapital] = useState<CompanyCapital | null>(null);
  const [shareholders, setShareholders] = useState<ShareholderRecord[]>([]);
  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwner[]>([]);
  const [boValidation, setBoValidation] = useState<BOValidation>({
    isValid: true,
    totalPercentage: 0,
    violations: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const companyId = localStorage.getItem("selectedCompanyId") || "";

  const loadData = async () => {
    if (!companyId) {
      setCompanyCapital(null);
      setCapitalSummary(null);
      setCapitalEntries([]);
      setShareholders([]);
      setBeneficialOwners([]);
      return;
    }

    setIsLoading(true);
    try {
      const [entries, summary, capital, shareholderData, owners, validation] = await Promise.all([
        CapitalService.getCapitalEntriesFromApi(companyId),
        CapitalService.getCapitalSummaryFromApi(companyId),
        CompanyCapitalService.getCompanyCapitalFromApi(companyId),
        CompanyCapitalService.getAllShareholdersFromApi(companyId),
        BeneficialOwnerService.getAllBeneficialOwners(companyId),
        BeneficialOwnerService.validateOwnership(companyId),
      ]);

      setCapitalEntries(entries);
      setCapitalSummary(summary);
      setCompanyCapital(capital);
      setShareholders(shareholderData);
      setBeneficialOwners(owners);
      setBoValidation(validation);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load capital data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleExportCSV = () => {
    const csvData = CapitalService.exportToCSV(capitalEntries);
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `capital_register_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Capital register has been exported to CSV",
    });
  };

  const handleCapitalSuccess = async () => {
    await loadData();
    setShowCapitalForm(false);
  };

  const handleBOSuccess = async () => {
    await loadData();
    setEditingBO(null);
    setShowBOForm(false);
  };

  const handleEditBO = (bo: BeneficialOwner) => {
    setEditingBO(bo);
    setShowBOForm(true);
  };

  const handleDeleteBO = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this beneficial owner?")) {
      return;
    }

    try {
      await BeneficialOwnerService.deleteBeneficialOwner(id);
      await loadData();
      toast({
        title: "Success",
        description: "Beneficial owner deleted successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete beneficial owner. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSetupComplete = companyCapital !== null;

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              Select a company before managing capital and equity.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Capital & Equity Management</h1>
              <p className="text-sm text-gray-600">
                Manage capital structure, shareholders, and beneficial owners from the backend ledger
              </p>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Live Backend
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={capitalEntries.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            {isSetupComplete && (
              <Button onClick={() => setShowEntryForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Record Transaction
              </Button>
            )}
            <Button variant={isSetupComplete ? "outline" : "default"} onClick={() => setShowCapitalForm(true)}>
              <Settings className="w-4 h-4 mr-2" />
              {isSetupComplete ? "Edit Setup" : "Setup Capital"}
            </Button>
          </div>
        </div>

        {!isSetupComplete && (
          <Alert className="mb-6">
            <Building className="h-4 w-4" />
            <AlertDescription>
              Set up the company capital structure before recording capital transactions.
            </AlertDescription>
          </Alert>
        )}

        {isSetupComplete && !boValidation.isValid && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{boValidation.violations.join(", ")}</AlertDescription>
          </Alert>
        )}

        {isSetupComplete && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{companyCapital?.authorized_shares.toLocaleString() || "0"}</div>
                    <div className="text-sm text-gray-600">Authorized Shares</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{companyCapital?.issued_shares.toLocaleString() || "0"}</div>
                    <div className="text-sm text-gray-600">Issued Shares</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{shareholders.length}</div>
                    <div className="text-sm text-gray-600">Shareholders</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">{beneficialOwners.length}</div>
                    <div className="text-sm text-gray-600">Beneficial Owners</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="shareholders" disabled={!isSetupComplete}>Shareholders</TabsTrigger>
            <TabsTrigger value="beneficial-owners" disabled={!isSetupComplete}>Beneficial Owners</TabsTrigger>
            <TabsTrigger value="transactions" disabled={!isSetupComplete}>Transactions</TabsTrigger>
            <TabsTrigger value="roi-simulator">ROI Simulator</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capital Structure Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {isSetupComplete && companyCapital ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Authorized Capital:</span>
                        <div className="font-bold">
                          {(companyCapital.authorized_shares * companyCapital.share_price).toLocaleString()} {companyCapital.currency}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Paid-up Capital:</span>
                        <div className="font-bold text-green-600">
                          {CapitalService.formatCurrency(capitalSummary?.total_capital || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Share Price:</span>
                        <div className="font-bold">
                          {companyCapital.share_price.toLocaleString()} {companyCapital.currency}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Available Shares:</span>
                        <div className="font-bold">
                          {(companyCapital.authorized_shares - companyCapital.issued_shares).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">Capital structure not initialized</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Capital Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : capitalEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No capital entries recorded yet</div>
                  ) : (
                    <div className="space-y-3">
                      {capitalEntries.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{entry.shareholder_name}</div>
                            <div className="text-sm text-gray-600">{entry.description || entry.type}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{entry.type}</Badge>
                            <div className="text-sm font-medium mt-1">{entry.amount.toLocaleString()} RWF</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="shareholders">
            <Card>
              <CardHeader>
                <CardTitle>Current Shareholders</CardTitle>
              </CardHeader>
              <CardContent>
                {shareholders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No shareholders registered yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium">Name</th>
                          <th className="text-right py-3 px-2 font-medium">Shares</th>
                          <th className="text-right py-3 px-2 font-medium">Ownership %</th>
                          <th className="text-left py-3 px-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shareholders.map((shareholder) => (
                          <tr key={shareholder.id} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-2 font-medium">{shareholder.name}</td>
                            <td className="py-4 px-2 text-right">
                              <Badge variant="outline">{shareholder.shares_held.toLocaleString()}</Badge>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <Badge variant="secondary">{shareholder.share_percentage.toFixed(2)}%</Badge>
                            </td>
                            <td className="py-4 px-2">
                              <Badge className={shareholder.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                                {shareholder.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="beneficial-owners">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Beneficial Owners Register
                  </span>
                  <Button onClick={() => setShowBOForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Beneficial Owner
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {beneficialOwners.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No beneficial owners registered yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium">Full Name</th>
                          <th className="text-left py-3 px-2 font-medium">Nationality</th>
                          <th className="text-right py-3 px-2 font-medium">Ownership %</th>
                          <th className="text-right py-3 px-2 font-medium">Control %</th>
                          <th className="text-left py-3 px-2 font-medium">Status</th>
                          <th className="text-left py-3 px-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {beneficialOwners.map((bo) => (
                          <tr key={bo.id} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-2 font-medium">{bo.full_name}</td>
                            <td className="py-4 px-2">{bo.nationality}</td>
                            <td className="py-4 px-2 text-right">
                              <Badge variant="outline">{bo.ownership_percentage.toFixed(2)}%</Badge>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <Badge variant="outline">{bo.control_percentage.toFixed(2)}%</Badge>
                            </td>
                            <td className="py-4 px-2">
                              <Badge className={bo.verification_status === "verified" ? "bg-green-100 text-green-700" : bo.verification_status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                                {bo.verification_status}
                              </Badge>
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditBO(bo)}>Edit</Button>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteBO(bo.id)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capital Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {capitalEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No capital transactions yet</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium">Date</th>
                            <th className="text-left py-3 px-2 font-medium">Shareholder</th>
                            <th className="text-left py-3 px-2 font-medium">Type</th>
                            <th className="text-right py-3 px-2 font-medium">Amount</th>
                            <th className="text-left py-3 px-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {capitalEntries.map((entry) => (
                            <tr key={entry.id} className="border-b hover:bg-gray-50">
                              <td className="py-4 px-2">{entry.date_contributed}</td>
                              <td className="py-4 px-2">{entry.shareholder_name}</td>
                              <td className="py-4 px-2">
                                <Badge variant="outline">{entry.type}</Badge>
                              </td>
                              <td className="py-4 px-2 text-right">{entry.amount.toLocaleString()} RWF</td>
                              <td className="py-4 px-2">
                                <Badge variant={entry.status === "confirmed" ? "default" : "secondary"}>{entry.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
              <MultiCurrencyManager />
              <CapitalLockingSystem />
            </div>
          </TabsContent>

          <TabsContent value="roi-simulator">
            <ROISimulator />
          </TabsContent>

          <TabsContent value="analytics">
            <EnhancedKPIDashboard />
          </TabsContent>
        </Tabs>

        <CapitalEntryForm open={showEntryForm} onClose={() => setShowEntryForm(false)} onSuccess={loadData} />
        <CompanyCapitalForm open={showCapitalForm} onClose={() => setShowCapitalForm(false)} onSuccess={handleCapitalSuccess} editData={companyCapital} />
        <EnhancedBeneficialOwnerForm
          open={showBOForm}
          onClose={() => {
            setShowBOForm(false);
            setEditingBO(null);
          }}
          onSuccess={handleBOSuccess}
          editData={editingBO}
        />
      </div>
    </div>
  );
}
