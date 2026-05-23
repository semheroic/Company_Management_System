import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  Loader2,
  RefreshCw,
  Shield,
  Users,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SystemHealthService, {
  SystemHealthActivity,
  SystemHealthRecommendation,
  SystemHealthResponse,
} from "@/services/systemHealthService";

const defaultData: SystemHealthResponse = {
  overview: {
    totalTransactions: 0,
    activeUsers: 0,
    activeAlerts: 0,
    pendingReturns: 0,
  },
  health: {
    ledgerBalanceScore: 0,
    complianceScore: 0,
    userCoverageScore: 0,
    documentationCoverageScore: 0,
  },
  recentActivity: [],
  recommendations: [],
};

export default function SystemHealthDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<SystemHealthResponse>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    void loadDashboard();
  }, []);

  const loadDashboard = async (showToast = false) => {
    const updateLoadingState = isLoading ? setIsLoading : setIsRefreshing;
    updateLoadingState(true);

    try {
      const response = await SystemHealthService.getDashboard();
      setData(response);

      if (showToast) {
        toast({
          title: "System Health Updated",
          description: "Latest backend metrics have been loaded.",
        });
      }
    } catch (error: any) {
      console.error("Failed to load system health dashboard:", error);
      toast({
        title: "Load Failed",
        description: error.response?.data?.error || "Could not load system health metrics from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getScoreTone = (score: number) => {
    if (score >= 95) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 65) return "text-yellow-600";
    return "text-red-600";
  };

  const getRecommendationTone = (severity: SystemHealthRecommendation["severity"]) => {
    switch (severity) {
      case "critical":
        return "border-red-200 bg-red-50 text-red-900";
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-900";
      case "info":
        return "border-blue-200 bg-blue-50 text-blue-900";
      case "success":
      default:
        return "border-green-200 bg-green-50 text-green-900";
    }
  };

  const getActivityIcon = (activity: SystemHealthActivity) => {
    if (activity.category === "alert") {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }

    if (activity.category === "tax") {
      return <Shield className="h-4 w-4 text-blue-600" />;
    }

    if (activity.category === "invoice" || activity.category === "receipt") {
      return <FileText className="h-4 w-4 text-green-600" />;
    }

    return <Activity className="h-4 w-4 text-slate-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span>Loading system health...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{data.overview.totalTransactions}</div>
                <div className="text-sm text-gray-600">Journal Transactions</div>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{data.overview.activeUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{data.overview.activeAlerts}</div>
                <div className="text-sm text-gray-600">Active Alerts</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{data.overview.pendingReturns}</div>
                <div className="text-sm text-gray-600">Pending Tax Returns</div>
              </div>
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Backend Health Scores
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => void loadDashboard(true)} disabled={isRefreshing}>
                {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ledger Balance</span>
                <span className={`text-sm font-semibold ${getScoreTone(data.health.ledgerBalanceScore)}`}>
                  {data.health.ledgerBalanceScore}%
                </span>
              </div>
              <Progress value={data.health.ledgerBalanceScore} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compliance</span>
                <span className={`text-sm font-semibold ${getScoreTone(data.health.complianceScore)}`}>
                  {data.health.complianceScore}%
                </span>
              </div>
              <Progress value={data.health.complianceScore} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active User Coverage</span>
                <span className={`text-sm font-semibold ${getScoreTone(data.health.userCoverageScore)}`}>
                  {data.health.userCoverageScore}%
                </span>
              </div>
              <Progress value={data.health.userCoverageScore} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Document Coverage</span>
                <span className={`text-sm font-semibold ${getScoreTone(data.health.documentationCoverageScore)}`}>
                  {data.health.documentationCoverageScore}%
                </span>
              </div>
              <Progress value={data.health.documentationCoverageScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Backend Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No recent backend activity found.</p>
              ) : (
                data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-slate-100 p-2">{getActivityIcon(activity)}</div>
                      <div>
                        <div className="text-sm font-medium">{activity.title}</div>
                        <div className="text-xs text-gray-500">{activity.subtitle}</div>
                        <div className="mt-1 text-xs text-gray-400">
                          {new Date(activity.occurred_at).toLocaleString()} • {activity.actor}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {activity.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className={`rounded-lg border p-4 ${getRecommendationTone(recommendation.severity)}`}
              >
                <div className="font-medium">{recommendation.title}</div>
                <div className="mt-1 text-sm opacity-90">{recommendation.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
