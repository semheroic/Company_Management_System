
import { useMemo, useState } from "react";
import { Download, FileText, DollarSign, Users, AlertTriangle, Eye, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ActionLoadingState from "@/components/common/ActionLoadingState";
import ReportService, { type ReportData, type ReportGenerationOptions } from "@/services/reportService";

interface QuickReportItem {
  id: number;
  name: string;
  description: string;
  icon: LucideIcon;
  type: string;
  generator: (options?: ReportGenerationOptions) => Promise<ReportData>;
}

const quickReports: QuickReportItem[] = [
  { 
    id: 1, 
    name: "Monthly Financial Summary", 
    description: "Revenue, expenses, and profit breakdown", 
    icon: DollarSign, 
    type: "financial",
    generator: ReportService.generateFinancialSummary
  },
  { 
    id: 2, 
    name: "Payroll Report", 
    description: "Employee salaries, PAYE, RSSB deductions", 
    icon: Users, 
    type: "hr",
    generator: ReportService.generatePayrollReport
  },
  { 
    id: 3, 
    name: "Tax Filing Bundle", 
    description: "VAT, PAYE, CIT reports with attachments", 
    icon: FileText, 
    type: "tax",
    generator: ReportService.generateVATReport
  },
  { 
    id: 4, 
    name: "Compliance Status", 
    description: "Registers, licenses, and deadline tracking", 
    icon: AlertTriangle, 
    type: "compliance",
    generator: ReportService.generateComplianceStatus
  },
  { 
    id: 5, 
    name: "Audit Trail", 
    description: "User actions and system changes log", 
    icon: Eye, 
    type: "audit",
    generator: ReportService.generateAuditTrail
  },
  { 
    id: 6, 
    name: "Performance Dashboard", 
    description: "KPIs and business metrics", 
    icon: TrendingUp, 
    type: "performance",
    generator: ReportService.generatePerformanceDashboard
  }
];

export default function QuickReports() {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<{ report: string; mode: "generate" | "export" } | null>(null);

  const loadingCopy = useMemo(() => {
    if (!activeAction) {
      return null;
    }

    return activeAction.mode === "export"
      ? {
          title: `Exporting ${activeAction.report}`,
          description: "Building the PDF from live backend report data.",
        }
      : {
          title: `Generating ${activeAction.report}`,
          description: "Collecting the latest report data before preview and export.",
        };
  }, [activeAction]);

  const handleGenerateReport = async (report: QuickReportItem) => {
    try {
      setActiveAction({ report: report.name, mode: "generate" });
      
      toast({
        title: "Generating Report",
        description: `Preparing ${report.name}...`,
      });

      const reportData = await report.generator();
      
      toast({
        title: "Report Generated",
        description: `${report.name} has been generated successfully.`,
      });

      console.log('Generated report data:', reportData);
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: `Failed to generate ${report.name}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleExportReport = async (report: QuickReportItem) => {
    try {
      setActiveAction({ report: report.name, mode: "export" });
      toast({
        title: "Preparing Download",
        description: `Generating PDF for ${report.name}...`,
      });

      const reportData = await report.generator();
      await ReportService.generatePDF(reportData);
      
      toast({
        title: "Download Complete",
        description: `${report.name} PDF has been downloaded.`,
      });
      
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export ${report.name} as PDF.`,
        variant: "destructive"
      });
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Quick Report Generation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadingCopy ? (
          <ActionLoadingState title={loadingCopy.title} description={loadingCopy.description} className="mb-4" />
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickReports.map((report) => (
            <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <report.icon className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-sm">{report.name}</h3>
                    <p className="text-xs text-gray-600">{report.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleGenerateReport(report)}
                  disabled={activeAction?.report === report.name}
                  className="flex-1"
                >
                  {activeAction?.report === report.name && activeAction.mode === "generate" ? "Generating..." : "Generate"}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleExportReport(report)}
                  disabled={activeAction?.report === report.name}
                  className="sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
