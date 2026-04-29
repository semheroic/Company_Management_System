import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Download, Edit, Eye, Filter, Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ComplaintRiskForm from "@/components/forms/ComplaintRiskForm";
import ComplaintRiskService, {
  ComplaintRiskIssue,
  ComplaintRiskSummary,
} from "@/services/complaintRiskService";

const EMPTY_SUMMARY: ComplaintRiskSummary = {
  totalIssues: 0,
  openIssues: 0,
  inProgressIssues: 0,
  resolvedIssues: 0,
};

export default function ComplaintRiskManagement() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<ComplaintRiskIssue[]>([]);
  const [summary, setSummary] = useState<ComplaintRiskSummary>(EMPTY_SUMMARY);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<ComplaintRiskIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadIssues = async () => {
    setIsLoading(true);
    try {
      const response = await ComplaintRiskService.getAll();
      setIssues(response.records);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load complaint and risk issues:", error);
      toast({
        title: "Load Failed",
        description: "Could not load complaint and risk issues from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchesCategory =
        filterCategory === "all" || issue.category.toLowerCase().includes(filterCategory.toLowerCase());
      const matchesSearch =
        query === "" ||
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.assignedTo.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, issues, searchTerm]);

  const saveIssue = async (issueData: any) => {
    try {
      const payload = {
        title: issueData.title,
        category: issueData.category,
        description: issueData.description,
        reportedDate: issueData.reportedDate,
        assignedTo: issueData.assignedTo,
        priority: issueData.priority,
        status: issueData.status,
        deadline: issueData.deadline,
      };

      if (editingIssue) {
        await ComplaintRiskService.update(editingIssue.id, payload);
      } else {
        await ComplaintRiskService.create(payload);
      }

      setEditingIssue(null);
      await loadIssues();
    } catch (error) {
      console.error("Failed to save issue:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the issue.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIssue = async (id: number) => {
    try {
      await ComplaintRiskService.remove(id);
      await loadIssues();
      toast({
        title: "Success",
        description: "Issue deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete issue:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the issue.",
        variant: "destructive",
      });
    }
  };

  const handleViewIssue = (issue: ComplaintRiskIssue) => {
    toast({
      title: issue.title,
      description: `Category: ${issue.category} | Status: ${issue.status}`,
    });
  };

  const handleDownloadIssue = (issue: ComplaintRiskIssue) => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(issue, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `${issue.title.replace(/\s+/g, "-").toLowerCase()}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Under Review":
        return "bg-blue-100 text-blue-800";
      case "Open":
        return "bg-red-100 text-red-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-purple-100 text-purple-800";
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
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
          <p className="text-sm text-gray-600">Loading complaint and risk issues...</p>
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
            <h1 className="text-2xl font-semibold">Complaint & Risk Management</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditingIssue(null);
                setShowForm(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Log Issue
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.totalIssues}</div>
              <div className="text-sm text-gray-600">Total Issues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{summary.openIssues}</div>
              <div className="text-sm text-gray-600">Open</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{summary.inProgressIssues}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.resolvedIssues}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Issues & Complaints Log
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                  className="rounded border bg-white px-3 py-1 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="client">Client Complaint</option>
                  <option value="risk">Risk</option>
                  <option value="compliance">Compliance Issue</option>
                  <option value="safety">Safety Issue</option>
                  <option value="hr">HR Issue</option>
                  <option value="it">IT Security</option>
                  <option value="financial">Financial Risk</option>
                </select>
                <Input
                  placeholder="Search issues..."
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
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reported Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                      No issues found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium">{issue.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{issue.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{issue.description}</TableCell>
                      <TableCell>{issue.reportedDate}</TableCell>
                      <TableCell>{issue.assignedTo || "Unassigned"}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadgeColor(issue.priority)}>{issue.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(issue.status)}>{issue.status}</Badge>
                      </TableCell>
                      <TableCell>{issue.deadline || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewIssue(issue)} title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingIssue(issue);
                              setShowForm(true);
                            }}
                            title="Edit Issue"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadIssue(issue)} title="Download Report">
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Delete Issue">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Issue</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{issue.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => void handleDeleteIssue(issue.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ComplaintRiskForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setEditingIssue(null);
          }}
          issue={editingIssue}
          onSubmit={(data) => void saveIssue(data)}
        />
      </div>
    </div>
  );
}
