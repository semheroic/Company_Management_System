import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Download, Eye, FileText, Filter, Loader2, Plus, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ContractForm } from "@/components/forms/ContractForm";
import ContractRegisterService, {
  ContractRecord,
  ContractSummary,
} from "@/services/contractRegisterService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ContractsAgreements() {
  const [showForm, setShowForm] = useState(false);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [summary, setSummary] = useState<ContractSummary>({
    totalContracts: 0,
    activeContracts: 0,
    expiringSoon: 0,
    totalValue: 0,
  });
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await ContractRegisterService.getAll();
      setContracts(response.records || []);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load contracts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const filteredContracts = contracts.filter((contract) => {
    const query = searchTerm.toLowerCase();
    const matchesType = filterType === "all" || contract.type.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch =
      query === "" ||
      contract.title.toLowerCase().includes(query) ||
      contract.parties.toLowerCase().includes(query) ||
      contract.type.toLowerCase().includes(query);

    return matchesType && matchesSearch;
  });

  const getStatusBadgeColor = (status: string, endDate: string) => {
    if (status === "Active") {
      const diffDays = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        return "bg-yellow-100 text-yellow-800";
      }
      return "bg-green-100 text-green-800";
    }

    if (status === "Expired") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const getDisplayStatus = (status: string, endDate: string) => {
    if (status === "Active") {
      const diffDays = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        return "Expiring Soon";
      }
    }

    return status;
  };

  const handleDownload = (contract: ContractRecord) => {
    if (!contract.file_path) return;
    window.open(`${API_BASE}/${contract.file_path}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-semibold">Contracts & Agreements</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refreshData()}>
              <Upload className="w-4 h-4 mr-2" />
              Refresh Register
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contract
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.totalContracts}</div>
              <div className="text-sm text-gray-600">Total Contracts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.activeContracts}</div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{summary.expiringSoon}</div>
              <div className="text-sm text-gray-600">Expiring Soon</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">RWF {summary.totalValue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contracts Register
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="lease">Lease</option>
                  <option value="supplier">Supplier</option>
                  <option value="consultant">Consultant</option>
                  <option value="employment">Employment</option>
                  <option value="nda">NDA</option>
                </select>
                <Input
                  placeholder="Search contracts..."
                  className="max-w-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value (RWF)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No contracts found. Add a contract to start the register.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => {
                    const displayStatus = getDisplayStatus(contract.status, contract.end_date);
                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{contract.type}</Badge>
                        </TableCell>
                        <TableCell>{contract.parties}</TableCell>
                        <TableCell>{contract.start_date}</TableCell>
                        <TableCell>{contract.end_date}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(contract.status, contract.end_date)}>
                            {displayStatus === "Expiring Soon" && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {displayStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{contract.value.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" disabled={!contract.file_path} onClick={() => handleDownload(contract)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" disabled={!contract.file_path} onClick={() => handleDownload(contract)}>
                              <Download className="w-4 h-4" />
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

        <ContractForm open={showForm} onClose={() => setShowForm(false)} onAdd={() => refreshData()} />
      </div>
    </div>
  );
}
