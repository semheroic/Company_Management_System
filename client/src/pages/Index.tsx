import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmployeeOverview } from "@/components/EmployeeOverview";
import { FinancialActivity } from "@/components/FinancialActivity";
import { ComplianceAlerts } from "@/components/ComplianceAlerts";
import { ComplianceOverview } from "@/components/ComplianceOverview";
import { QuickActions } from "@/components/QuickActions";
import { RecentTransactions } from "@/components/RecentTransactions";
import SystemHealthDashboard from "@/components/SystemHealthDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompanySelector from "@/components/CompanySelector";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-4 p-6 bg-white border-b border-gray-100">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors" />
              <DashboardHeader />
            </div>
            <CompanySelector />
          </div>
          
          <div className="flex-1 p-8">
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="overview">Business Overview</TabsTrigger>
                <TabsTrigger value="system">System Health</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                {/* Top Row - Key Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <EmployeeOverview />
                  <FinancialActivity />
                  <ComplianceOverview />
                </div>

                {/* Middle Row - Alerts and Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ComplianceAlerts />
                  <QuickActions />
                </div>

                {/* Bottom Row - Recent Activity */}
                <RecentTransactions />
              </TabsContent>

              <TabsContent value="system">
                <SystemHealthDashboard />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
