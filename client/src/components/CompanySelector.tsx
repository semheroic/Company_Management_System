import React, { useState, useEffect } from "react";
import { Building2, ChevronDown, Plus, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const id = localStorage.getItem("selectedCompanyId");
  if (id) config.headers["x-company-id"] = id;
  return config;
});

export default function CompanySelector() {
  const { toast } = useToast();
  const [currentCompany, setCurrentCompany] = useState(null);
  const [userCompanies, setUserCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentIds, setRecentIds] = useState([]);
  
  // States for the switching animation
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingTo, setSwitchingTo] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const selectedId = localStorage.getItem("selectedCompanyId");
      
      const [listRes, currentRes] = await Promise.allSettled([
        api.get(`/api/companies`),
        selectedId ? api.get(`/api/company/${selectedId}`) : Promise.resolve({ data: null })
      ]);

      const companies = listRes.status === "fulfilled" ? listRes.value.data : [];
      setUserCompanies(Array.isArray(companies) ? companies : []);
      
      if (currentRes.status === "fulfilled" && currentRes.value.data) {
        setCurrentCompany(currentRes.value.data);
      } else if (currentRes.status === "rejected" && currentRes.value.reason?.response?.status === 403) {
        toast({ 
          title: "Access Restricted", 
          description: "Your selected workspace is currently inactive.", 
          variant: "destructive" 
        });
        setCurrentCompany(null);
      } else if (Array.isArray(companies) && companies.length > 0) {
        const firstActive = companies.find(c => c.status === 'active') || companies[0];
        setCurrentCompany(firstActive);
        localStorage.setItem("selectedCompanyId", firstActive.id);
      }

      setRecentIds(JSON.parse(localStorage.getItem('recent_companies') || '[]'));
    } catch (error) {
      console.error("Selector Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCompanySwitch = (company) => {
    if (company.status !== 'active') {
      return toast({ 
        title: "Cannot Switch", 
        description: `This company is ${company.status}. Please contact admin.`,
        variant: "destructive"
      });
    }

    setSwitchingTo(company.name);
    setIsSwitching(true);

    const updatedRecents = [company.id, ...recentIds.filter(id => id !== company.id)].slice(0, 3);
    localStorage.setItem('recent_companies', JSON.stringify(updatedRecents));
    localStorage.setItem("selectedCompanyId", company.id);
    
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const recentlyOpened = userCompanies.filter(c => recentIds.includes(c.id));
  const allOtherCompanies = userCompanies.filter(c => !recentIds.includes(c.id));

  if (isLoading) return <div className="p-2 text-xs text-gray-400 animate-pulse">Loading Workspace...</div>;

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isSwitching}>
          <Button 
            variant="outline" 
            className={`w-64 justify-between bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ${isSwitching ? "border-blue-400 ring-2 ring-blue-50" : ""}`}
          >
            {isSwitching ? (
              /* Centered Switching State */
              <div className="flex items-center justify-center w-full gap-3 animate-in fade-in zoom-in-95 duration-300">
                <Loader2 className="w-4 h-4 shrink-0 text-blue-600 animate-spin" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mb-0.5">Switching to</span>
                  <span className="text-sm font-bold truncate max-w-[140px] text-gray-800">{switchingTo}</span>
                </div>
              </div>
            ) : (
              /* Default State */
              <>
                <div className="flex items-center gap-2 text-left overflow-hidden">
                  <Building2 className={`w-4 h-4 shrink-0 ${currentCompany?.status === 'active' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-bold truncate">{currentCompany?.name || 'Select Business'}</span>
                    <span className="text-[10px] text-gray-500 font-mono">TIN: {currentCompany?.tin || '---'}</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-72 p-2">
          {recentlyOpened.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase flex items-center gap-1 p-2">
                <Clock className="w-3 h-3" /> Recent
              </DropdownMenuLabel>
              {recentlyOpened.map(c => (
                <CompanyItem 
                  key={c.id} 
                  company={c} 
                  isActive={currentCompany?.id === c.id} 
                  onSelect={handleCompanySwitch}
                  disabled={isSwitching}
                />
              ))}
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
          )}

          <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase p-2">All Companies</DropdownMenuLabel>
          <div className="max-h-64 overflow-y-auto">
            {allOtherCompanies.length === 0 && recentlyOpened.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">No companies found</div>
            ) : (
              allOtherCompanies.map(c => (
                <CompanyItem 
                  key={c.id} 
                  company={c} 
                  isActive={currentCompany?.id === c.id} 
                  onSelect={handleCompanySwitch}
                  disabled={isSwitching}
                />
              ))
            )}
          </div>
          
          <DropdownMenuSeparator />
          <DialogTrigger asChild disabled={isSwitching}>
            <DropdownMenuItem className="text-blue-600 font-bold p-3 cursor-pointer focus:text-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Add New Company
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddCompanyModal onSuccess={() => { setIsModalOpen(false); loadData(); }} />
    </Dialog>
  );
}

function CompanyItem({ company, isActive, onSelect, disabled }) {
  const isPending = company.status === 'pending';
  const isInactive = company.status === 'inactive';

  return (
    <DropdownMenuItem 
      disabled={disabled}
      onClick={() => onSelect(company)} 
      className={`p-3 cursor-pointer rounded-md mb-1 flex flex-col items-start ${isActive ? 'bg-blue-50' : ''} ${(isPending || isInactive) ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between w-full">
        <span className={`font-semibold text-sm truncate ${isActive ? 'text-blue-700' : ''}`}>
          {company.name}
        </span>
        <div className="flex gap-1">
          {isActive && <Badge className="text-[9px] h-4 bg-blue-100 text-blue-700 border-none">Active</Badge>}
          {isPending && <Badge variant="outline" className="text-[9px] h-4 text-orange-600 border-orange-200">Pending</Badge>}
          {isInactive && <Badge variant="outline" className="text-[9px] h-4 text-gray-500">Inactive</Badge>}
        </div>
      </div>
      <span className="text-[10px] text-gray-500 mt-0.5">
        TIN: {company.tin || 'N/A'} • {company.currency} • {company.size || '---'}
      </span>
    </DropdownMenuItem>
  );
}

function AddCompanyModal({ onSuccess }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await api.post(`/api/company`, data);
      toast({ title: "Success", description: `${data.name} is now active.` });
      if (!localStorage.getItem("selectedCompanyId")) {
        localStorage.setItem("selectedCompanyId", res.data.id);
      }
      onSuccess();
    } catch (err) {
      toast({ 
        title: "Registration Failed", 
        description: err.response?.data?.error || "Check your network or TIN", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl overflow-hidden flex flex-col max-h-[95vh] p-0">
      <div className="p-6 overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Register New Company</DialogTitle>
          <DialogDescription>Your workspace will be set to <span className="font-bold text-green-600">Active</span> automatically.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Business Name *</Label>
            <Input name="name" required placeholder="e.g. Acme Corporation Ltd" className="h-11" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">TIN Number</Label>
            <Input name="tin" placeholder="9 digit code" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Registration No.</Label>
            <Input name="registration_number" placeholder="RDB Ref Number" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Currency</Label>
            <select name="currency" className="w-full h-10 border rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="RWF">RWF (Francs)</option>
              <option value="USD">USD (Dollars)</option>
              <option value="EUR">EUR (Euros)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Industry Sector</Label>
            <select name="sector" className="w-full h-10 border rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="agriculture">Agriculture</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="services">Services</option>
              <option value="retail">Retail</option>
              <option value="construction">Construction</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Scale</Label>
            <select name="size" className="w-full h-10 border rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="micro">Micro (1-10 Employees)</option>
              <option value="small">Small (11-50)</option>
              <option value="medium">Medium (51-100)</option>
              <option value="large">Large (100+)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Incorporation Date</Label>
            <Input name="incorporation_date" type="date" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Fiscal Year Start</Label>
            <Input name="fiscal_year_start" defaultValue="01-01" placeholder="MM-DD" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Tax Regime</Label>
            <Input name="tax_regime" defaultValue="General" />
          </div>

          <div className="col-span-2 pt-4 flex items-center gap-2">
            <div className="h-[1px] bg-gray-100 flex-1" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact & Location</span>
            <div className="h-[1px] bg-gray-100 flex-1" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Official Email</Label>
            <Input name="email" type="email" placeholder="info@company.com" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Phone Number</Label>
            <Input name="phone" placeholder="+250..." />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs uppercase text-gray-500 font-bold">Address</Label>
            <Input name="address" placeholder="Province, District, Sector, Cell" />
          </div>

          <Button disabled={submitting} type="submit" className="col-span-2 mt-2 bg-blue-600 hover:bg-blue-700 h-12 text-md font-bold shadow-lg shadow-blue-100">
            {submitting ? "Processing..." : "Register & Start Working"}
          </Button>
        </form>
      </div>
    </DialogContent>
  );
}