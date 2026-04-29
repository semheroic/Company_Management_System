import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Edit, Eye, FileText, Filter, Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import AuditReportForm from "@/components/forms/AuditReportForm";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import InternalAuditReportService, {
  InternalAuditReport,
  InternalAuditSummary,
} from "@/services/internalAuditReportService";
import { API_BASE } from "@/services/companyApi";

const EMPTY_SUMMARY: InternalAuditSummary = {
  totalReports: 0,
  completed: 0,
  inProgress: 0,
  totalFindings: 0,
};

export default function InternalAuditReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<InternalAuditReport[]>([]);
  const [summary, setSummary] = useState<InternalAuditSummary>(EMPTY_SUMMARY);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<InternalAuditReport | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<InternalAuditReport | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await InternalAuditReportService.getAll();
      setReports(response.records);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load internal audit reports:", error);
      toast({
        title: "Load Failed",
        description: "Could not load internal audit reports from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesType = filterType === "all" || report.auditType.toLowerCase().includes(filterType.toLowerCase());
      const matchesSearch =
        query === "" ||
        report.title.toLowerCase().includes(query) ||
        report.auditor.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [filterType, reports, searchTerm]);

  const saveReport = async (formData: any) => {
    const payload = {
      title: formData.title,
      auditType: formData.auditType,
      auditor: formData.auditor,
      auditedPeriod: formData.auditedPeriod,
      reportDate: formData.reportDate || "",
      status: formData.status,
      findings: Number(formData.findings || 0),
      description: formData.description || "",
      recommendations: formData.recommendations || "",
      attachment: formData.attachments?.[0] || null,
    };

    try {
      if (editingReport) {
        await InternalAuditReportService.update(editingReport.id, payload);
        toast({
          title: "Success",
          description: "Audit report has been updated successfully.",
        });
      } else {
        await InternalAuditReportService.create(payload);
        toast({
          title: "Success",
          description: "Audit report has been added successfully.",
        });
      }

      setEditingReport(null);
      await loadReports();
    } catch (error) {
      console.error("Failed to save audit report:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the audit report.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      await InternalAuditReportService.remove(reportToDelete.id);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      await loadReports();
      toast({
        title: "Success",
        description: "Audit report has been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete audit report:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the audit report.",
        variant: "destructive",
      });
    }
  };

  const handleViewReport = (report: InternalAuditReport) => {
    if (report.attachmentFilePath) {
      window.open(`${API_BASE}/${report.attachmentFilePath}`, "_blank", "noopener,noreferrer");
      return;
    }

    toast({
      title: report.title,
      description: report.description || "No additional description available.",
    });
  };

  const handleDownloadReport = (report: InternalAuditReport) => {
    if (report.attachmentFilePath) {
      window.open(`${API_BASE}/${report.attachmentFilePath}`, "_blank", "noopener,noreferrer");
      return;
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.title.replace(/\s+/g, "-").toLowerCase()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading audit reports...</p>
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
            <h1 className="text-2xl font-semibold">Internal Audit Reports</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditingReport(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Report
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.totalReports}</div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{summary.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.totalFindings}</div>
              <div className="text-sm text-gray-600">Total Findings</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Reports Register
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(event) => setFilterType(event.target.value)}
                  className="rounded border bg-white px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="financial">Financial</option>
                  <option value="it">IT</option>
                  <option value="compliance">Compliance</option>
                  <option value="operational">Operational</option>
                </select>
                <Input
                  placeholder="Search reports..."
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
                  <TableHead>Report Title</TableHead>
                  <TableHead>Audit Type</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Period Audited</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                      No audit reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.auditType}</Badge>
                      </TableCell>
                      <TableCell>{report.auditor}</TableCell>
                      <TableCell>{report.auditedPeriod}</TableCell>
                      <TableCell>{report.reportDate || "TBD"}</TableCell>
                      <TableCell>{report.findings}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(report.status)}>{report.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewReport(report)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingReport(report);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReportToDelete(report);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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

        <AuditReportForm
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingReport(null);
          }}
          onSubmit={(formData) => void saveReport(formData)}
          editData={
            editingReport
              ? {
                  title: editingReport.title,
                  auditType: editingReport.auditType,
                  auditor: editingReport.auditor,
                  auditedPeriod: editingReport.auditedPeriod,
                  reportDate: editingReport.reportDate,
                  status: editingReport.status,
                  findings: editingReport.findings,
                  description: editingReport.description,
                  recommendations: editingReport.recommendations,
                }
              : undefined
          }
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Audit Report</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{reportToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleDeleteReport()}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
