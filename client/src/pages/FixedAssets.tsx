import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calculator,
  Eye,
  FileText,
  Filter,
  Loader2,
  Plus,
  TrendingDown,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FixedAssetForm } from "@/components/forms/FixedAssetForm";
import FixedAssetService, { FixedAsset } from "@/services/fixedAssetService";
import UniversalTransactionService from "@/services/universalTransactionService";
import { useToast } from "@/hooks/use-toast";

export default function FixedAssets() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [showDepreciationDialog, setShowDepreciationDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const allAssets = await FixedAssetService.getAllAssets();
      setAssets(allAssets);
    } catch (error) {
      console.error("Failed to load fixed assets:", error);
      toast({
        title: "Load Failed",
        description: "Could not load fixed assets from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssets();
  }, []);

  const handleAssetSuccess = async () => {
    await loadAssets();
  };

  const handleUpdateDepreciation = async () => {
    await loadAssets();
    toast({
      title: "Depreciation Updated",
      description: "Current asset book values have been recalculated.",
    });
  };

  const handlePostMonthlyDepreciation = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    UniversalTransactionService.postMonthlyDepreciation(currentMonth);
    await loadAssets();
    toast({
      title: "Monthly Depreciation Posted",
      description: "Depreciation entries have been posted to accounting books.",
    });
  };

  const handleRetireAsset = async (asset: FixedAsset) => {
    try {
      await FixedAssetService.retireAsset(asset.id, new Date().toISOString().split("T")[0]);
      await loadAssets();
      toast({
        title: "Asset Retired",
        description: `${asset.name} has been marked as retired.`,
      });
    } catch (error) {
      console.error("Failed to retire asset:", error);
      toast({
        title: "Update Failed",
        description: "Could not retire the selected asset.",
        variant: "destructive",
      });
    }
  };

  const handleExportAssets = () => {
    const csvData = FixedAssetService.exportToCSV(filteredAssets.length ? filteredAssets : assets);
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fixed-assets-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Fixed assets data has been exported to CSV.",
    });
  };

  const filteredAssets = assets.filter((asset) => {
    const query = searchTerm.toLowerCase();
    const matchesCategory =
      filterCategory === "all" || asset.category.toLowerCase().includes(filterCategory.toLowerCase());
    const matchesStatus = filterStatus === "all" || asset.status === filterStatus;
    const matchesSearch =
      query === "" ||
      asset.name.toLowerCase().includes(query) ||
      asset.location.toLowerCase().includes(query) ||
      asset.supplier?.toLowerCase().includes(query);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const summary = FixedAssetService.getAssetSummary(assets);
  const categories = [...new Set(assets.map((asset) => asset.category))];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "retired":
        return "bg-yellow-100 text-yellow-800";
      case "disposed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading fixed assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold">Fixed Assets Register</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void handleUpdateDepreciation()}>
              <Calculator className="mr-2 h-4 w-4" />
              Update Depreciation
            </Button>
            <Button variant="outline" onClick={() => void handlePostMonthlyDepreciation()}>
              <FileText className="mr-2 h-4 w-4" />
              Post Monthly Depreciation
            </Button>
            <Button variant="outline" onClick={handleExportAssets}>
              <Upload className="mr-2 h-4 w-4" />
              Export Assets
            </Button>
            <Button onClick={() => setShowAssetForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.totalAssets}</div>
              <div className="text-sm text-gray-600">Total Assets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{FixedAssetService.formatCurrency(summary.totalOriginalCost)}</div>
              <div className="text-sm text-gray-600">Original Cost</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{FixedAssetService.formatCurrency(summary.totalCurrentValue)}</div>
              <div className="text-sm text-gray-600">Current Value</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{FixedAssetService.formatCurrency(summary.totalDepreciation)}</div>
              <div className="text-sm text-gray-600">Total Depreciation</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Assets Register
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="max-w-xs"
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
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Acquisition Date</TableHead>
                  <TableHead className="text-right">Original Cost</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">Useful Life</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                      No fixed assets found. Add an asset to start the register.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => {
                    const depreciation = FixedAssetService.calculateDepreciation(asset);
                    return (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{asset.category}</Badge>
                        </TableCell>
                        <TableCell>{asset.acquisitionDate}</TableCell>
                        <TableCell className="text-right">
                          {FixedAssetService.formatCurrency(asset.acquisitionCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {FixedAssetService.formatCurrency(depreciation.currentBookValue)}
                        </TableCell>
                        <TableCell className="text-right">{asset.usefulLifeYears} years</TableCell>
                        <TableCell>{asset.location || "Not set"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(asset.status)}>{asset.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Depreciation Schedule"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowDepreciationDialog(true);
                              }}
                            >
                              <TrendingDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Details"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowDepreciationDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {asset.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Retire Asset"
                                onClick={() => void handleRetireAsset(asset)}
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                            )}
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

        <Dialog open={showDepreciationDialog} onOpenChange={setShowDepreciationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Depreciation Schedule - {selectedAsset?.name}</DialogTitle>
            </DialogHeader>
            {selectedAsset && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 rounded bg-gray-50 p-4">
                  <div>
                    <div className="text-sm text-gray-600">Original Cost</div>
                    <div className="font-semibold">
                      {FixedAssetService.formatCurrency(selectedAsset.acquisitionCost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Residual Value</div>
                    <div className="font-semibold">
                      {FixedAssetService.formatCurrency(selectedAsset.residualValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Useful Life</div>
                    <div className="font-semibold">{selectedAsset.usefulLifeYears} years</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Depreciation Method</div>
                    <div className="font-semibold capitalize">
                      {selectedAsset.depreciationMethod.replace("_", " ")}
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Opening Value</TableHead>
                      <TableHead className="text-right">Depreciation</TableHead>
                      <TableHead className="text-right">Closing Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FixedAssetService.getDepreciationSchedule(selectedAsset).map((row) => (
                      <TableRow key={row.year}>
                        <TableCell>{row.year}</TableCell>
                        <TableCell className="text-right">
                          {FixedAssetService.formatCurrency(row.openingValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {FixedAssetService.formatCurrency(row.depreciation)}
                        </TableCell>
                        <TableCell className="text-right">
                          {FixedAssetService.formatCurrency(row.closingValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <FixedAssetForm
          open={showAssetForm}
          onClose={() => setShowAssetForm(false)}
          onSuccess={handleAssetSuccess}
        />
      </div>
    </div>
  );
}
