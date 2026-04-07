
import {
  Building2,
  Users,
  FileText,
  BookOpen,
  Calculator,
  Receipt,
  UserCheck,
  Bell,
  FolderLock,
  BarChart3,
  Shield,
  Calendar,
  Home,
  Settings,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Target
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Link, useLocation } from "react-router-dom"
import { useState } from "react"

const companyItems = [
  {
    title: "Company Profile",
    url: "/company-profile",
    icon: Building2,
  },
  {
    title: "Directors & Shareholders",
    url: "/directors-shareholders",
    icon: Users,
  },
  {
    title: "Capital & Equity",
    url: "/capital-equity",
    icon: Target,
  },
  {
    title: "Meeting Minutes",
    url: "/meeting-minutes",
    icon: FileText,
  },
  {
    title: "Business Plan & Strategy",
    url: "/business-plan",
    icon: Target,
  },
]

const complianceItems = [
  {
    title: "Accounting Books",
    url: "/accounting-books",
    icon: Calculator,
  },
  {
    title: "General Ledger",
    url: "/general-ledger",
    icon: BookOpen,
  },
  {
    title: "Trial Balance",
    url: "/trial-balance",
    icon: Calculator,
  },
  {
    title: "Invoices & Receipts",
    url: "/invoices-receipts",
    icon: Receipt,
  },
  {
    title: "Contracts & Agreements",
    url: "/contracts-agreements",
    icon: FileText,
  },
  {
    title: "Fixed Assets",
    url: "/fixed-assets",
    icon: Building2,
  },
  {
    title: "Tax Returns",
    url: "/tax-returns",
    icon: Receipt,
  },
  {
    title: "Client & Supplier Registers",
    url: "/client-supplier-registers",
    icon: Users,
  },
]

const statutoryRegisters = [
  {
    title: "Statutory Registers",
    url: "/registers",
  },
]

const hrItems = [
  {
    title: "Payroll & HR",
    url: "/payroll-hr",
    icon: UserCheck,
  },
  {
    title: "Employee Records",
    url: "/employee-records",
    icon: Users,
  },
]

const operationsItems = [
  {
    title: "Internal Audit Reports",
    url: "/internal-audit-reports",
    icon: BarChart3,
  },
  {
    title: "Complaint & Risk Management",
    url: "/complaint-risk-management",
    icon: AlertTriangle,
  },
]

const systemItems = [
  {
    title: "Compliance Alerts",
    url: "/compliance-alerts",
    icon: Bell,
  },
  {
    title: "Compliance Calendar",
    url: "/compliance-calendar",
    icon: Calendar,
  },
  {
    title: "Document Vault",
    url: "/document-vault",
    icon: FolderLock,
  },
  {
    title: "Reports & Audit",
    url: "/reports-audit",
    icon: BarChart3,
  },
  {
    title: "User Management",
    url: "/user-management",
    icon: Shield,
  },
]

export function AppSidebar() {
  const [isStatutoryRegistersOpen, setIsStatutoryRegistersOpen] = useState(false)
  const location = useLocation()

  const isActiveRoute = (url: string) => {
    return location.pathname === url
  }

  return (
    <Sidebar variant="inset" className="border-r bg-white">
      <SidebarHeader className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-base">Office Manager</h2>
            <p className="text-xs text-gray-500">Rwanda Compliance</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        <SidebarGroup className="mb-8">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={`menu-item ${isActiveRoute('/') ? 'menu-item-active' : ''}`}>
                  <Link to="/">
                    <Home className="menu-item-icon" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mb-8">
          <SidebarGroupLabel className="section-title">Company Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {companyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`menu-item ${isActiveRoute(item.url) ? 'menu-item-active' : ''}`}>
                    <Link to={item.url}>
                      <item.icon className="menu-item-icon" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mb-8">
          <SidebarGroupLabel className="section-title">Compliance & Governance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <Collapsible 
                open={isStatutoryRegistersOpen} 
                onOpenChange={setIsStatutoryRegistersOpen}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="menu-item">
                      <BookOpen className="menu-item-icon" />
                      <span className="font-medium">Statutory Registers</span>
                      {isStatutoryRegistersOpen ? (
                        <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                      {statutoryRegisters.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild className={`menu-item text-sm ${isActiveRoute(item.url) ? 'menu-item-active' : ''}`}>
                            <Link to={item.url}>
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              
              {complianceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`menu-item ${isActiveRoute(item.url) ? 'menu-item-active' : ''}`}>
                    <Link to={item.url}>
                      <item.icon className="menu-item-icon" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mb-8">
          <SidebarGroupLabel className="section-title">Human Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {hrItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`menu-item ${isActiveRoute(item.url) ? 'menu-item-active' : ''}`}>
                    <Link to={item.url}>
                      <item.icon className="menu-item-icon" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mb-8">
          <SidebarGroupLabel className="section-title">Operations & Oversight</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`menu-item ${isActiveRoute(item.url) ? 'menu-item-active' : ''}`}>
                    <Link to={item.url}>
                      <item.icon className="menu-item-icon" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="section-title">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`menu-item ${isActiveRoute(item.url) ? 'menu-item-active' : ''}`}>
                    <Link to={item.url}>
                      <item.icon className="menu-item-icon" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 px-4 py-4">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={`menu-item ${isActiveRoute('/settings') ? 'menu-item-active' : ''}`}>
              <Link to="/settings">
                <Settings className="menu-item-icon" />
                <span className="font-medium">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={`menu-item ${isActiveRoute('/help') ? 'menu-item-active' : ''}`}>
              <Link to="/help">
                <HelpCircle className="menu-item-icon" />
                <span className="font-medium">Help & Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
