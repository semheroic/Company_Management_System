import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardHeader, DashboardUserMenu } from "@/components/DashboardHeader";
import { EmployeeOverview } from "@/components/EmployeeOverview";
import { FinancialActivity } from "@/components/FinancialActivity";
import { ComplianceAlerts } from "@/components/ComplianceAlerts";
import { ComplianceOverview } from "@/components/ComplianceOverview";
import { QuickActions } from "@/components/QuickActions";
import { RecentTransactions } from "@/components/RecentTransactions";
import SystemHealthDashboard from "@/components/SystemHealthDashboard";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompanySelector from "@/components/CompanySelector";
import { Loader2, ShieldCheck } from "lucide-react";

const Index = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Simulate a professional boot sequence (fetching initial session/company data)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200); // 1.2s creates a smooth transition without being annoying
    return () => clearTimeout(timer);
  }, []);

  // Professional Loading Screen
  if (isInitialLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
          {/* Brand Logo Placeholder / Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-25"></div>
            <div className="relative bg-indigo-600 p-4 rounded-xl shadow-lg shadow-indigo-200">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Office Manager</h2>
          <div className="mt-4 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Securing your workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50/50 animate-in fade-in duration-700">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Top Navigation Bar */}
          <header className="flex items-center justify-between gap-4 p-4 lg:p-6 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-all active:scale-95" />
              <div className="h-6 w-[1px] bg-gray-200 hidden md:block mx-2" />
              <DashboardHeader />
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter />
              <CompanySelector />
              <DashboardUserMenu />
            </div>
          </header>
          
          <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <Tabs defaultValue="overview" className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <TabsList className="bg-white border border-gray-200 p-1 h-12 shadow-sm">
                  <TabsTrigger 
                    value="overview" 
                    className="px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                  >
                    Business Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="system" 
                    className="px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                  >
                    System Health
                  </TabsTrigger>
                </TabsList>

                <div className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded-full font-medium">
                  Last Sync: {new Date().toLocaleTimeString()}
                </div>
              </div>

              <TabsContent value="overview" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                {/* Top Row - Critical Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <EmployeeOverview />
                  <FinancialActivity />
                  <ComplianceOverview />
                </div>

                {/* Middle Row - Operational Intelligence */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ComplianceAlerts />
                  <QuickActions />
                </div>

                {/* Bottom Row - Audit Trail */}
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                    <h3 className="font-semibold text-gray-800">Recent Registry Activity</h3>
                  </div>
                  <RecentTransactions />
                </div>
              </TabsContent>

              <TabsContent value="system" className="animate-in zoom-in-95 duration-300">
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
