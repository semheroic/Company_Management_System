import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Forms
import { ShareCertificateForm } from "@/components/forms/ShareCertificateForm";
import { ChargeForm } from "@/components/forms/ChargeForm";
import { BeneficialOwnerForm } from "@/components/forms/BeneficialOwnerForm";
import { DividendDeclarationForm } from "@/components/forms/DividendDeclarationForm";

// Components
import { CapitalManagementDashboard } from "@/components/CapitalManagementDashboard";
import { RegistersHeader } from "@/components/registers/RegistersHeader";
import { ShareCertificatesTab } from "@/components/registers/ShareCertificatesTab";
import { ChargesTab } from "@/components/registers/ChargesTab";
import { BeneficialOwnersTab } from "@/components/registers/BeneficialOwnersTab";

// Set base URL globally if not already set in main.tsx
axios.defaults.baseURL = 'http://localhost:5000';

export default function Registers() {
  const { toast } = useToast();
  
  // Use the same ID logic as your working component
  const companyId = localStorage.getItem('selectedCompanyId') || "9";

  // Data States
  const [shareRecords, setShareRecords] = useState([]);
  const [chargeRecords, setChargeRecords] = useState([]);
  const [beneficialOwners, setBeneficialOwners] = useState([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("share-certificates");

  // Modal States
  const [showShareForm, setShowShareForm] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [showBeneficialForm, setShowBeneficialForm] = useState(false);
  const [showDividendForm, setShowDividendForm] = useState(false);

  // --- 1. FETCH DATA (Following working example pattern) ---
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const headers = { "x-company-id": companyId };
      
      // We fetch individually to handle specific errors and mapping
      const certsRes = await axios.get(`/api/company/${companyId}/certificates`, { headers });
      const chargesRes = await axios.get(`/api/company/${companyId}/charges`, { headers });
      const boRes = await axios.get(`/api/company/${companyId}/beneficial-owners`, { headers });

      // MAPPING: Ensure data matches frontend expectations
      setShareRecords(certsRes.data.map((c: any) => ({
        id: c.id,
        certificateNo: c.certificate_no,
        holder: c.holder_name,
        shares: c.shares_count,
        date: c.issue_date ? new Date(c.issue_date).toISOString().split('T')[0] : ""
      })));

      setChargeRecords(chargesRes.data.map((ch: any) => ({
        id: ch.id,
        type: ch.charge_type,
        amount: ch.amount_display,
        creditor: ch.creditor_name,
        date: ch.registration_date ? new Date(ch.registration_date).toISOString().split('T')[0] : "",
        status: ch.status
      })));

      setBeneficialOwners(boRes.data);

      if (isManual) {
        toast({ title: "Sync Complete", description: "Registers updated from database." });
      }
    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast({
        title: "Connection Error",
        description: error.response?.data?.error || "Could not load register data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler for successful form submissions
  const handleRefresh = () => {
    fetchData();
  };

  if (isLoading && !isSyncing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600 font-medium">Connecting to Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <RegistersHeader />
          <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? "Syncing..." : "Refresh Registers"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="share-certificates">Share Certificates</TabsTrigger>
            <TabsTrigger value="charges">Charges</TabsTrigger>
            <TabsTrigger value="beneficial-owners">Beneficial Owners</TabsTrigger>
            <TabsTrigger value="capital-management">Capital Management</TabsTrigger>
          </TabsList>

          <TabsContent value="share-certificates">
            <ShareCertificatesTab 
              shareRecords={shareRecords}
              onAddCertificate={() => setShowShareForm(true)}
            />
          </TabsContent>

          <TabsContent value="charges">
            <ChargesTab 
              chargeRecords={chargeRecords}
              onAddCharge={() => setShowChargeForm(true)}
            />
          </TabsContent>

          <TabsContent value="beneficial-owners">
            <BeneficialOwnersTab 
              beneficialOwners={beneficialOwners}
              onAddBeneficialOwner={() => setShowBeneficialForm(true)}
            />
          </TabsContent>

          <TabsContent value="capital-management">
            <CapitalManagementDashboard companyId={companyId} />
          </TabsContent>
        </Tabs>

        {/* Modal Forms */}
        <ShareCertificateForm 
          open={showShareForm} 
          onClose={() => setShowShareForm(false)} 
          onAdd={handleRefresh}
        />
        
        <ChargeForm 
          open={showChargeForm} 
          onClose={() => setShowChargeForm(false)} 
          onAdd={handleRefresh}
        />
        
        <BeneficialOwnerForm 
          open={showBeneficialForm} 
          onClose={() => setShowBeneficialForm(false)} 
          onAdd={handleRefresh}
        />

        <DividendDeclarationForm 
          open={showDividendForm} 
          onClose={() => setShowDividendForm(false)} 
          onSuccess={handleRefresh}
        />
      </div>
    </div>
  );
}