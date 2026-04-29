import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ManualAlertForm from "@/components/forms/ManualAlertForm";
import { useToast } from "@/hooks/use-toast";
import ComplianceAlertService, {
  ComplianceAlertRecord,
  ComplianceAlertSummary,
} from "@/services/complianceAlertService";

const EMPTY_SUMMARY: ComplianceAlertSummary = {
  total: 0,
  active: 0,
  acknowledged: 0,
  resolved: 0,
  highPriority: 0,
};

export default function ComplianceAlerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<ComplianceAlertRecord[]>([]);
  const [summary, setSummary] = useState<ComplianceAlertSummary>(EMPTY_SUMMARY);
  const [isManualAlertOpen, setIsManualAlertOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    severity: "all",
    status: "all",
    role: "admin",
  });

  const loadAlerts = async () => {
    try {
      const response = await ComplianceAlertService.getAll();
      setAlerts(response.records);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load compliance alerts:", error);
      toast({
        title: "Load Failed",
        description: "Could not load compliance alerts from the backend.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    void loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesRole =
        filters.role === "all" ||
        alert.forRole.includes(filters.role) ||
        alert.forRole.includes("admin");
      const matchesType = filters.type === "all" || alert.type === filters.type;
      const matchesSeverity = filters.severity === "all" || alert.severity === filters.severity;
      const matchesStatus = filters.status === "all" || alert.status === filters.status;

      return matchesRole && matchesType && matchesSeverity && matchesStatus;
    });
  }, [alerts, filters]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "snoozed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tax":
        return <AlertTriangle className="h-4 w-4" />;
      case "hr":
        return <XCircle className="h-4 w-4" />;
      case "compliance":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getDaysUntilDue = (dueDate: string): string => {
    const days = ComplianceAlertService.getDaysUntilDue(dueDate);
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days} days left`;
  };

  const getDaysColor = (dueDate: string): string => {
    const days = ComplianceAlertService.getDaysUntilDue(dueDate);
    if (days < 0) return "text-red-600 font-semibold";
    if (days <= 3) return "text-red-500";
    if (days <= 7) return "text-yellow-600";
    return "text-gray-600";
  };

  const updateStatus = async (
    alertId: number,
    status: ComplianceAlertRecord["status"],
    options?: { isRead?: boolean; snoozedUntil?: string | null },
  ) => {
    try {
      await ComplianceAlertService.updateStatus(alertId, status, options);
      await loadAlerts();
      toast({
        title: "Alert Updated",
        description: `Alert marked as ${status}.`,
      });
    } catch (error) {
      console.error("Failed to update alert:", error);
      toast({
        title: "Update Failed",
        description: "Could not update the selected alert.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      severity: "all",
      status: "all",
      role: "admin",
    });
  };

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
            <h1 className="text-2xl font-semibold">Alert Center</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={() => setIsManualAlertOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{summary.active}</div>
              <div className="text-sm text-gray-600">Active Alerts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{summary.acknowledged}</div>
              <div className="text-sm text-gray-600">Acknowledged</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.resolved}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-500">{summary.highPriority}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-sm text-gray-600">Total Alerts</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tax">Tax</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select value={filters.severity} onValueChange={(value) => setFilters((prev) => ({ ...prev, severity: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="snoozed">Snoozed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Role View</label>
                <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="hr">HR Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="all">All Roles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert Center ({filteredAlerts.length} alerts)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Alert</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className={!alert.isRead ? "bg-blue-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(alert.type)}
                        <span className="capitalize">{alert.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-gray-600">{alert.description}</div>
                        {alert.actionRequired && (
                          <div className="mt-1 text-xs text-blue-600">Action: {alert.actionRequired}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(alert.status)}>{alert.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{alert.dueDate}</div>
                        <div className={`text-xs ${getDaysColor(alert.dueDate)}`}>
                          {getDaysUntilDue(alert.dueDate)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={alert.source === "auto" ? "bg-green-50" : "bg-blue-50"}>
                        {alert.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {alert.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void updateStatus(alert.id, "acknowledged", { isRead: true })}
                            >
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                void updateStatus(alert.id, "snoozed", {
                                  isRead: true,
                                  snoozedUntil: tomorrow.toISOString().split("T")[0],
                                });
                              }}
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                            <Button size="sm" onClick={() => void updateStatus(alert.id, "resolved", { isRead: true })}>
                              Resolve
                            </Button>
                          </>
                        )}
                        {alert.status === "acknowledged" && (
                          <Button size="sm" onClick={() => void updateStatus(alert.id, "resolved", { isRead: true })}>
                            Resolve
                          </Button>
                        )}
                        {alert.status === "resolved" && <Badge variant="outline">Completed</Badge>}
                        {alert.status === "snoozed" && (
                          <Badge variant="outline" className="bg-purple-50">
                            <Clock className="mr-1 h-3 w-3" />
                            Snoozed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ManualAlertForm
          open={isManualAlertOpen}
          onClose={() => setIsManualAlertOpen(false)}
          onAlertCreated={() => void loadAlerts()}
        />
      </div>
    </div>
  );
}
