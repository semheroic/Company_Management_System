import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"
import { DataSyncNotification } from "@/components/DataSyncNotification"
import Index from './pages/Index';
import CompanyProfile from './pages/CompanyProfile';
import DirectorsShareholders from './pages/DirectorsShareholders';
import EmployeeRecords from './pages/EmployeeRecords';
import PayrollHR from './pages/PayrollHR';
import InvoicesReceipts from './pages/InvoicesReceipts';
import AccountingBooks from './pages/AccountingBooks';
import GeneralLedger from './pages/GeneralLedger';
import TrialBalance from './pages/TrialBalance';
import FixedAssets from './pages/FixedAssets';
import ClientSupplierRegisters from './pages/ClientSupplierRegisters';
import ContractsAgreements from './pages/ContractsAgreements';
import MeetingMinutes from './pages/MeetingMinutes';
import DocumentVault from './pages/DocumentVault';
import TaxReturns from './pages/TaxReturns';
import ComplianceCalendar from './pages/ComplianceCalendar';
import ComplianceAlerts from './pages/ComplianceAlerts';
import ReportsAudit from './pages/ReportsAudit';
import InternalAuditReports from './pages/InternalAuditReports';
import BusinessPlan from './pages/BusinessPlan';
import ComplaintRiskManagement from './pages/ComplaintRiskManagement';
import Registers from './pages/Registers';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import CapitalEquity from "./pages/CapitalEquity";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Toaster />
          <DataSyncNotification />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/company-profile" element={<CompanyProfile />} />
            <Route path="/directors-shareholders" element={<DirectorsShareholders />} />
            <Route path="/capital-equity" element={<CapitalEquity />} />
            <Route path="/employee-records" element={<EmployeeRecords />} />
            <Route path="/payroll-hr" element={<PayrollHR />} />
            <Route path="/invoices-receipts" element={<InvoicesReceipts />} />
            <Route path="/accounting-books" element={<AccountingBooks />} />
            <Route path="/general-ledger" element={<GeneralLedger />} />
            <Route path="/trial-balance" element={<TrialBalance />} />
            <Route path="/fixed-assets" element={<FixedAssets />} />
            <Route path="/client-supplier-registers" element={<ClientSupplierRegisters />} />
            <Route path="/contracts-agreements" element={<ContractsAgreements />} />
            <Route path="/meeting-minutes" element={<MeetingMinutes />} />
            <Route path="/document-vault" element={<DocumentVault />} />
            <Route path="/tax-returns" element={<TaxReturns />} />
            <Route path="/compliance-calendar" element={<ComplianceCalendar />} />
            <Route path="/compliance-alerts" element={<ComplianceAlerts />} />
            <Route path="/reports-audit" element={<ReportsAudit />} />
            <Route path="/internal-audit-reports" element={<InternalAuditReports />} />
            <Route path="/business-plan" element={<BusinessPlan />} />
            <Route path="/complaint-risk-management" element={<ComplaintRiskManagement />} />
            <Route path="/registers" element={<Registers />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
