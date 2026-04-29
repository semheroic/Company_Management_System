import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Eye, Filter, Loader2, Plus, Upload, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ClientSupplierForm } from "@/components/forms/ClientSupplierForm";
import ClientSupplierRegisterService, {
  ClientSupplierRecord,
  ClientSupplierSummary,
} from "@/services/clientSupplierRegisterService";
import { useToast } from "@/hooks/use-toast";

export default function ClientSupplierRegisters() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [entities, setEntities] = useState<ClientSupplierRecord[]>([]);
  const [summary, setSummary] = useState<ClientSupplierSummary>({
    totalContacts: 0,
    clients: 0,
    suppliers: 0,
    active: 0,
  });
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await ClientSupplierRegisterService.getAll();
      setEntities(response.records || []);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load client and supplier records:", error);
      toast({
        title: "Load Failed",
        description: "Could not load the client and supplier register.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const filteredEntities = entities.filter((entity) => {
    const query = searchTerm.toLowerCase();
    const matchesType = filterType === "all" || entity.type.toLowerCase() === filterType.toLowerCase();
    const matchesSearch =
      query === "" ||
      entity.name.toLowerCase().includes(query) ||
      entity.taxId.toLowerCase().includes(query) ||
      entity.email.toLowerCase().includes(query) ||
      entity.phone.toLowerCase().includes(query);

    return matchesType && matchesSearch;
  });

  const handleExportContacts = () => {
    const exportData = filteredEntities.length ? filteredEntities : entities;
    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `client-supplier-register-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  const handleOpenAttachment = (entity: ClientSupplierRecord) => {
    if (!entity.agreementFilePath) {
      toast({
        title: "No Attachment",
        description: "This record does not have an uploaded agreement.",
      });
      return;
    }

    window.open(
      `${ClientSupplierRegisterService.apiBase}/${entity.agreementFilePath}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold">Client & Supplier Registers</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportContacts}>
              <Upload className="mr-2 h-4 w-4" />
              Export Contacts
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.totalContacts}</div>
              <div className="text-sm text-gray-600">Total Contacts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{summary.clients}</div>
              <div className="text-sm text-gray-600">Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.suppliers}</div>
              <div className="text-sm text-gray-600">Suppliers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client & Supplier Directory
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(event) => setFilterType(event.target.value)}
                  className="rounded border px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="client">Clients</option>
                  <option value="supplier">Suppliers</option>
                </select>
                <Input
                  placeholder="Search contacts..."
                  className="max-w-xs"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tax ID</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                      No contacts found. Add a client or supplier to start the register.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntities.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell className="font-medium">{entity.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            entity.type === "Client"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {entity.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{entity.category}</TableCell>
                      <TableCell>{entity.taxId}</TableCell>
                      <TableCell>{entity.email}</TableCell>
                      <TableCell>{entity.phone}</TableCell>
                      <TableCell>
                        <Badge className={entity.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {entity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenAttachment(entity)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenAttachment(entity)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ClientSupplierForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => refreshData()}
        />
      </div>
    </div>
  );
}
