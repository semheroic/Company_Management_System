import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/services/companyApi";

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

interface ShareRecord {
  id: number;
  certificateNo: string;
  holder: string;
  shares: number;
  date: string;
}

interface ChargeRecord {
  id: number;
  type: string;
  amount: string;
  creditor: string;
  date: string;
  status: string;
}

interface BeneficialOwnerRecord {
  id: number;
  name: string;
  nationalId: string;
  ownership: number;
  nationality: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return "";

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
};

const mapShareRecord = (record: any): ShareRecord => ({
  id: Number(record.id),
  certificateNo: record.certificate_no || record.certificate_number || record.certificateNo || "",
  holder: record.holder_name || record.holder || record.full_name || "",
  shares: Number(record.shares_count ?? record.shares ?? 0),
  date: formatDate(record.issue_date || record.date),
});

const mapChargeRecord = (record: any): ChargeRecord => ({
  id: Number(record.id),
  type: record.charge_type || record.type || "",
  amount: record.amount_display || record.amount || "",
  creditor: record.creditor_name || record.creditor || "",
  date: formatDate(record.registration_date || record.date),
  status: record.status || "Unknown",
});

const mapBeneficialOwnerRecord = (record: any): BeneficialOwnerRecord => ({
  id: Number(record.id),
  name: record.full_name || record.name || "",
  nationalId: record.id_number || record.national_id || record.nationalId || "",
  ownership: Number(
    record.ownership_percentage ??
      record.ownership ??
      record.control_percentage ??
      0,
  ),
  nationality: record.nationality || "",
});

export default function Registers() {
  const { toast } = useToast();

  const companyId = localStorage.getItem("selectedCompanyId") || "";

  // Data States
  const [shareRecords, setShareRecords] = useState<ShareRecord[]>([]);
  const [chargeRecords, setChargeRecords] = useState<ChargeRecord[]>([]);
  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwnerRecord[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("share-certificates");

  // Modal States
  const [showShareForm, setShowShareForm] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [showBeneficialForm, setShowBeneficialForm] = useState(false);
  const [showDividendForm, setShowDividendForm] = useState(false);

  const fetchData = useCallback(async (isManual = false) => {
    if (!companyId) {
      setShareRecords([]);
      setChargeRecords([]);
      setBeneficialOwners([]);
      setIsLoading(false);
      setIsSyncing(false);
      return;
    }

    if (isManual) setIsSyncing(true);
    else setIsLoading(true);

    const headers = { "x-company-id": companyId };
    const endpoints = [
      axios.get(`${API_BASE}/api/company/${companyId}/certificates`, { headers }),
      axios.get(`${API_BASE}/api/company/${companyId}/charges`, { headers }),
      axios.get(`${API_BASE}/api/company/${companyId}/beneficial-owners`, { headers }),
    ] as const;

    try {
      const [certsResult, chargesResult, ownersResult] = await Promise.allSettled(endpoints);
      const failedSections: string[] = [];

      if (certsResult.status === "fulfilled") {
        const records = Array.isArray(certsResult.value.data) ? certsResult.value.data : [];
        setShareRecords(records.map(mapShareRecord));
      } else {
        console.error("Share certificates fetch failed:", certsResult.reason);
        setShareRecords([]);
        failedSections.push("share certificates");
      }

      if (chargesResult.status === "fulfilled") {
        const records = Array.isArray(chargesResult.value.data) ? chargesResult.value.data : [];
        setChargeRecords(records.map(mapChargeRecord));
      } else {
        console.error("Charges fetch failed:", chargesResult.reason);
        setChargeRecords([]);
        failedSections.push("charges");
      }

      if (ownersResult.status === "fulfilled") {
        const records = Array.isArray(ownersResult.value.data) ? ownersResult.value.data : [];
        setBeneficialOwners(records.map(mapBeneficialOwnerRecord));
      } else {
        console.error("Beneficial owners fetch failed:", ownersResult.reason);
        setBeneficialOwners([]);
        failedSections.push("beneficial owners");
      }

      if (failedSections.length === 0) {
        if (isManual) {
          toast({ title: "Sync Complete", description: "Registers updated from database." });
        }
        return;
      }

      toast({
        title: failedSections.length === 3 ? "Connection Error" : "Partial Data Loaded",
        description:
          failedSections.length === 3
            ? "Could not load register data."
            : `Some sections could not be loaded: ${failedSections.join(", ")}.`,
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
