import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  FileText,
  Folder,
  Loader2,
  Search,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { DocumentUploadForm } from "@/components/forms/DocumentUploadForm";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import { ExportButton } from "@/components/common/ExportButton";
import { useToast } from "@/hooks/use-toast";
import DocumentVaultService, {
  DocumentVaultRecord,
  DocumentVaultSummary,
} from "@/services/documentVaultService";
import { API_BASE } from "@/services/companyApi";

const DOCUMENT_CATEGORIES = [
  { value: "rdb-registration", label: "RDB Registration" },
  { value: "trading-licenses", label: "Trading Licenses" },
  { value: "tax-filing", label: "Tax Filing" },
  { value: "hr-contracts", label: "HR/Staff Contracts" },
  { value: "contracts-agreements", label: "Contracts & Agreements" },
  { value: "assets-insurance", label: "Assets & Insurance" },
  { value: "internal-docs", label: "Internal Documents" },
];

const EMPTY_SUMMARY: DocumentVaultSummary = {
  totalDocuments: 0,
  securedDocuments: 0,
  categories: 0,
};

export default function DocumentVault() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentVaultRecord[]>([]);
  const [summary, setSummary] = useState<DocumentVaultSummary>(EMPTY_SUMMARY);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await DocumentVaultService.getAll();
      setDocuments(response.records);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load document vault:", error);
      toast({
        title: "Load Failed",
        description: "Could not load document vault records from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesCategory = selectedCategory === "all" || document.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query === "" ||
        document.title.toLowerCase().includes(query) ||
        document.description.toLowerCase().includes(query) ||
        document.fileName.toLowerCase().includes(query);

      const uploadedDate = new Date(document.uploadedAt);
      if (dateRange.from && uploadedDate < dateRange.from) return false;
      if (dateRange.to && uploadedDate > dateRange.to) return false;

      return matchesCategory && matchesQuery;
    });
  }, [dateRange.from, dateRange.to, documents, searchQuery, selectedCategory]);

  const thisMonthDocuments = documents.filter((document) => {
    const uploadedDate = new Date(document.uploadedAt);
    const now = new Date();
    return uploadedDate.getMonth() === now.getMonth() && uploadedDate.getFullYear() === now.getFullYear();
  }).length;

  const handleDeleteDocument = async (id: number) => {
    try {
      await DocumentVaultService.remove(id);
      await loadDocuments();
      toast({
        title: "Document Deleted",
        description: "The selected document has been removed.",
      });
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the selected document.",
        variant: "destructive",
      });
    }
  };

  const handleOpenDocument = (document: DocumentVaultRecord) => {
    window.open(`${API_BASE}/${document.filePath}`, "_blank", "noopener,noreferrer");
  };

  const exportColumns = [
    { key: "title", label: "Document Title" },
    { key: "category", label: "Category" },
    { key: "uploadedBy", label: "Uploaded By" },
    { key: "uploadedAt", label: "Upload Date" },
    { key: "type", label: "File Type" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                <FileText className="h-8 w-8 text-blue-600" />
                Document Vault
              </h1>
              <p className="mt-2 text-gray-600">
                Secure storage for all your business documents with compliance tracking
              </p>
            </div>
            <div className="flex gap-3">
              <ExportButton
                data={filteredDocuments}
                filename="document-vault-export"
                title="Document Vault Export"
                columns={exportColumns}
              />
              <Button onClick={() => setShowUploadForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Documents</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.totalDocuments}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-green-600">{summary.categories}</p>
                  </div>
                  <Folder className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Secured Docs</p>
                    <p className="text-2xl font-bold text-orange-600">{summary.securedDocuments}</p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-purple-600">{thisMonthDocuments}</p>
                  </div>
                  <Download className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6 p-6">
            <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
              <div className="flex-1">
                <DateRangeFilter onDateRangeChange={(from, to) => setDateRange({ from, to })} />
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-64 pl-10"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Uploaded By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Uploaded At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">File Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((document) => (
                    <tr key={document.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{document.title}</div>
                        {document.description && (
                          <div className="text-sm text-gray-500">{document.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{document.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{document.uploadedBy || "Unknown"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                          {document.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDocument(document)}>
                            Open
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(document.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <DocumentUploadForm
              onClose={() => setShowUploadForm(false)}
              onSuccess={() => void loadDocuments()}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
