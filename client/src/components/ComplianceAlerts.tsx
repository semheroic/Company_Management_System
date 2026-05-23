import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle, Clock, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ComplianceAlertService, { ComplianceAlertRecord } from "@/services/complianceAlertService";

export function ComplianceAlerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<ComplianceAlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    void loadComplianceAlerts();
  }, []);

  const loadComplianceAlerts = async () => {
    setIsLoading(true);
    try {
      const { records } = await ComplianceAlertService.getAll();
      const sorted = records
        .filter((alert) => alert.status === "active")
        .sort((left, right) => {
          const priority = { high: 3, medium: 2, low: 1 };
          return priority[right.severity] - priority[left.severity];
        })
        .slice(0, 5);

      setAlerts(sorted);
    } catch (error) {
      console.error("Error loading compliance alerts:", error);
      toast({
        title: "Load Failed",
        description: "Could not load compliance alerts from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlertStatus = async (alertId: number, status: ComplianceAlertRecord["status"]) => {
    setUpdatingId(alertId);
    try {
      await ComplianceAlertService.updateStatus(alertId, status, { isRead: true });
      await loadComplianceAlerts();
    } catch (error) {
      console.error("Error updating compliance alert:", error);
      toast({
        title: "Update Failed",
        description: "Could not update the compliance alert.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getPriorityColor = (priority: ComplianceAlertRecord["severity"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getPriorityIcon = (priority: ComplianceAlertRecord["severity"]) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <Clock className="h-4 w-4" />;
      case "low":
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Compliance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading alerts...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Compliance Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => (window.location.href = "/compliance-alerts")}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <p className="font-medium">All caught up</p>
            <p className="text-sm">No active compliance alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border p-3 transition-colors hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className={getPriorityColor(alert.severity)}>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(alert.severity)}
                          {alert.severity.toUpperCase()}
                        </div>
                      </Badge>
                      <span className="text-xs text-gray-500">Due: {new Date(alert.dueDate).toLocaleDateString()}</span>
                    </div>
                    <h4 className="mb-1 text-sm font-medium">{alert.title}</h4>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void updateAlertStatus(alert.id, "resolved")}
                      className="text-green-600 hover:text-green-700"
                      disabled={updatingId === alert.id}
                    >
                      {updatingId === alert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void updateAlertStatus(alert.id, "acknowledged")}
                      className="text-gray-400 hover:text-gray-600"
                      disabled={updatingId === alert.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
