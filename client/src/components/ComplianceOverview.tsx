import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import ComplianceAlertService from "@/services/complianceAlertService";
import TaxReturnRegisterService from "@/services/taxReturnRegisterService";

export function ComplianceOverview() {
  const [complianceData, setComplianceData] = useState({
    overallScore: 0,
    upcomingDeadlines: 0,
    overdueTasks: 0,
    completedThisMonth: 0,
    criticalAlerts: 0,
    status: "unknown" as "good" | "warning" | "critical" | "unknown",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      const [{ records: taxReturns }, { records: alerts }] = await Promise.all([
        TaxReturnRegisterService.getAll(),
        ComplianceAlertService.getAll(),
      ]);

      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const upcomingDeadlines = taxReturns.filter((record) => {
        const dueDate = new Date(record.dueDate);
        return record.status !== "Filed" && dueDate >= currentDate && dueDate <= thirtyDaysFromNow;
      }).length;

      const overdueTasks = taxReturns.filter((record) => {
        return record.status !== "Filed" && new Date(record.dueDate) < currentDate;
      }).length;

      const criticalAlerts = alerts.filter((alert) => alert.severity === "high").length;
      const totalObligations = taxReturns.length || 1;
      const completedObligations = taxReturns.filter((record) => record.status === "Filed").length;
      const overallScore = (completedObligations / totalObligations) * 100;
      const completedThisMonth = taxReturns.filter((record) => {
        if (record.status !== "Filed" || !record.submissionDate) {
          return false;
        }

        const submissionDate = new Date(record.submissionDate);
        return submissionDate >= monthStart && submissionDate <= currentDate;
      }).length;

      let status: "good" | "warning" | "critical" = "good";
      if (overdueTasks > 0 || criticalAlerts > 2) {
        status = "critical";
      } else if (upcomingDeadlines > 2 || criticalAlerts > 0) {
        status = "warning";
      }

      setComplianceData({
        overallScore,
        upcomingDeadlines,
        overdueTasks,
        completedThisMonth,
        criticalAlerts,
        status,
      });
    } catch (error) {
      console.error("Error loading compliance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Compliance Overview</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Compliance Overview</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{complianceData.overallScore.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Compliance Score</p>
            </div>
            <Badge className={getStatusColor(complianceData.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(complianceData.status)}
                {complianceData.status.toUpperCase()}
              </div>
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-orange-600">{complianceData.upcomingDeadlines}</div>
              <div className="text-xs text-muted-foreground">Upcoming (30 days)</div>
            </div>
            <div>
              <div className="font-medium text-green-600">{complianceData.completedThisMonth}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>

          {complianceData.overdueTasks > 0 && (
            <div className="flex items-center gap-2 rounded bg-red-50 p-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{complianceData.overdueTasks} overdue tasks require attention</span>
            </div>
          )}

          {complianceData.criticalAlerts > 0 && (
            <div className="flex items-center gap-2 rounded bg-yellow-50 p-2 text-sm text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{complianceData.criticalAlerts} critical alerts</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/compliance-alerts"}>
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
