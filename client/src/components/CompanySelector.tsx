import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { resolveAssetUrl } from "@/lib/api";
import { API_BASE } from "@/services/companyApi";

const QUICK_SWITCH_LIMIT = 3;

const api = axios.create({ baseURL: API_BASE, withCredentials: true });
api.interceptors.request.use((config) => {
  const id = localStorage.getItem("selectedCompanyId");
  if (id) config.headers["x-company-id"] = id;
  return config;
});

interface CompanyRecord {
  id: number;
  name: string;
  logo_url?: string | null;
  registration_number?: string | null;
  tin?: string | null;
  currency?: string | null;
  size?: string | null;
  status: "active" | "inactive" | "pending" | "suspended";
}

interface CompanyItemProps {
  company: CompanyRecord;
  isActive: boolean;
  isRecent: boolean;
  disabled: boolean;
  isDeleting: boolean;
  showSwitchButton?: boolean;
  onSelect: (company: CompanyRecord) => void;
  onDelete: (company: CompanyRecord) => void;
}

interface AddCompanyModalProps {
  onSuccess: (companyId: number) => void;
}

export default function CompanySelector() {
  const { toast } = useToast();
  const [currentCompany, setCurrentCompany] = useState<CompanyRecord | null>(null);
  const [userCompanies, setUserCompanies] = useState<CompanyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingTo, setSwitchingTo] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showMoreCompanies, setShowMoreCompanies] = useState(false);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const selectedId = localStorage.getItem("selectedCompanyId");
      const [listRes, currentRes] = await Promise.allSettled([
        api.get<CompanyRecord[]>("/api/companies"),
        selectedId ? api.get<CompanyRecord>(`/api/company/${selectedId}`) : Promise.resolve({ data: null }),
      ]);

      const companies =
        listRes.status === "fulfilled" && Array.isArray(listRes.value.data) ? listRes.value.data : [];
      setUserCompanies(companies);

      if (currentRes.status === "fulfilled" && currentRes.value.data) {
        setCurrentCompany(currentRes.value.data);
      } else if (companies.length > 0) {
        const fallbackCompany = companies.find((company) => company.status === "active") || companies[0];
        setCurrentCompany(fallbackCompany);
        localStorage.setItem("selectedCompanyId", String(fallbackCompany.id));
      } else {
        setCurrentCompany(null);
        localStorage.removeItem("selectedCompanyId");
      }

      const storedRecents = JSON.parse(localStorage.getItem("recent_companies") || "[]");
      setRecentIds(Array.isArray(storedRecents) ? storedRecents.map(Number).filter(Boolean) : []);
      setShowMoreCompanies(false);
    } catch (error) {
      console.error("Selector Error:", error);
      toast({
        title: "Workspace Error",
        description: "Could not load companies for this account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCompanySwitch = (company: CompanyRecord) => {
    if (company.status !== "active") {
      toast({
        title: "Cannot Switch",
        description: `This company is ${company.status}. Please contact an administrator.`,
        variant: "destructive",
      });
      return;
    }

    if (currentCompany?.id === company.id) {
      return;
    }

    setCurrentCompany(company);
    setSwitchingTo(company.name);
    setIsSwitching(true);

    const updatedRecents = [company.id, ...recentIds.filter((id) => id !== company.id)].slice(0, 5);
    localStorage.setItem("recent_companies", JSON.stringify(updatedRecents));
    localStorage.setItem("selectedCompanyId", String(company.id));
    setRecentIds(updatedRecents);

    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleDeleteCompany = async (company: CompanyRecord) => {
    const confirmed = window.confirm(`Archive ${company.name}? This removes it from the active company list.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(company.id);

    try {
      const response = await api.delete(`/api/company/${company.id}`);
      const remainingCompanies = userCompanies.filter((candidate) => candidate.id !== company.id);
      const updatedRecents = recentIds.filter((id) => id !== company.id);

      localStorage.setItem("recent_companies", JSON.stringify(updatedRecents));
      setRecentIds(updatedRecents);

      if (String(company.id) === localStorage.getItem("selectedCompanyId")) {
        const fallbackCompany =
          remainingCompanies.find((candidate) => candidate.status === "active") || remainingCompanies[0];

        if (fallbackCompany) {
          localStorage.setItem("selectedCompanyId", String(fallbackCompany.id));
        } else {
          localStorage.removeItem("selectedCompanyId");
        }
      }

      toast({
        title: "Company Archived",
        description: response.data?.message || `${company.name} has been archived.`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error?.response?.data?.error || "Could not archive this company.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const prioritizedCompanies = useMemo(() => {
    const byId = new Map(userCompanies.map((company) => [company.id, company]));
    const orderedIds: number[] = [];

    if (currentCompany?.id && byId.has(currentCompany.id)) {
      orderedIds.push(currentCompany.id);
    }

    recentIds.forEach((id) => {
      if (byId.has(id) && !orderedIds.includes(id)) {
        orderedIds.push(id);
      }
    });

    userCompanies.forEach((company) => {
      if (!orderedIds.includes(company.id)) {
        orderedIds.push(company.id);
      }
    });

    return orderedIds
      .map((id) => byId.get(id))
      .filter((company): company is CompanyRecord => Boolean(company));
  }, [currentCompany?.id, recentIds, userCompanies]);

  const quickSwitchCompanies = prioritizedCompanies.slice(0, QUICK_SWITCH_LIMIT);
  const overflowCompanies = prioritizedCompanies.slice(QUICK_SWITCH_LIMIT);

  if (isLoading) {
    return <div className="animate-pulse p-2 text-xs text-gray-400">Loading Workspace...</div>;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isSwitching || deletingId !== null}>
          <Button
            variant="outline"
            className={`min-w-0 w-full max-w-[18rem] justify-between overflow-hidden border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 sm:w-72 ${
              isSwitching ? "border-blue-400 ring-2 ring-blue-50" : ""
            }`}
          >
            {isSwitching ? (
              <div className="flex w-full items-center justify-center gap-3">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
                <div className="flex flex-col items-start leading-none">
                  <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-500">
                    Switching to
                  </span>
                  <span className="max-w-[150px] truncate text-sm font-bold text-gray-800">
                    {switchingTo}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 overflow-hidden text-left">
                  <CompanyLogo company={currentCompany} />
                  <div className="flex flex-col truncate">
                    <span className="truncate text-sm font-bold">
                      {currentCompany?.name || "Select Business"}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      TIN: {currentCompany?.tin || "---"}
                    </span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[min(20rem,calc(100vw-2rem))] p-2 sm:w-80">
          <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase text-gray-400">
            Quick Switch
          </DropdownMenuLabel>

          {quickSwitchCompanies.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">No companies found</div>
          ) : (
            <div className="space-y-1">
              {quickSwitchCompanies.map((company) => (
                <CompanyItem
                  key={company.id}
                  company={company}
                  isActive={currentCompany?.id === company.id}
                  isRecent={recentIds.includes(company.id)}
                  disabled={isSwitching || deletingId !== null}
                  isDeleting={deletingId === company.id}
                  onSelect={handleCompanySwitch}
                  onDelete={handleDeleteCompany}
                />
              ))}
            </div>
          )}

          {overflowCompanies.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {!showMoreCompanies ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-center text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setShowMoreCompanies(true)}
                >
                  View More Companies ({overflowCompanies.length})
                </Button>
              ) : (
                <div className="space-y-2">
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase text-gray-400">
                    Other Companies
                  </DropdownMenuLabel>
                  <div className="max-h-56 space-y-1 overflow-y-auto">
                    {overflowCompanies.map((company) => (
                      <CompanyItem
                        key={company.id}
                        company={company}
                        isActive={currentCompany?.id === company.id}
                        isRecent={recentIds.includes(company.id)}
                        disabled={isSwitching || deletingId !== null}
                        isDeleting={deletingId === company.id}
                        showSwitchButton
                        onSelect={handleCompanySwitch}
                        onDelete={handleDeleteCompany}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-center text-xs font-semibold text-gray-500 hover:bg-gray-50"
                    onClick={() => setShowMoreCompanies(false)}
                  >
                    Show Less
                  </Button>
                </div>
              )}
            </>
          )}

          <DropdownMenuSeparator />
          <DialogTrigger asChild disabled={isSwitching || deletingId !== null}>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start p-3 font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Company
            </Button>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddCompanyModal
        onSuccess={(companyId) => {
          localStorage.setItem("selectedCompanyId", String(companyId));
          setIsModalOpen(false);
          void loadData();
        }}
      />
    </Dialog>
  );
}

function CompanyLogo({ company }: { company: CompanyRecord | null }) {
  const logoUrl = resolveAssetUrl(company?.logo_url);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={company?.name || "Company logo"}
        className="h-9 w-9 rounded-lg border border-gray-200 object-cover"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
      <Building2
        className={`h-4 w-4 ${company?.status === "active" ? "text-blue-600" : "text-gray-400"}`}
      />
    </div>
  );
}

function CompanyItem({
  company,
  isActive,
  isRecent,
  disabled,
  isDeleting,
  showSwitchButton = false,
  onSelect,
  onDelete,
}: CompanyItemProps) {
  const isPending = company.status === "pending";
  const isInactive = company.status === "inactive";
  const isSuspended = company.status === "suspended";

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-md border p-3 ${
        isActive ? "border-blue-200 bg-blue-50/70" : "border-transparent bg-white"
      } ${isPending || isInactive || isSuspended ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(company)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:cursor-not-allowed"
      >
        <CompanyLogo company={company} />
        <div className="min-w-0">
          <div className={`truncate text-sm font-semibold ${isActive ? "text-blue-700" : ""}`}>
            {company.name}
          </div>
          <span className="mt-0.5 block text-[10px] text-gray-500">
            TIN: {company.tin || "N/A"} | {company.currency || "RWF"} | {company.size || "---"}
          </span>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex gap-1">
          {isActive && (
            <Badge className="h-4 border-none bg-blue-100 text-[9px] text-blue-700">
              Active
            </Badge>
          )}
          {!isActive && isRecent && (
            <Badge className="h-4 border-none bg-slate-100 text-[9px] text-slate-600">
              Recent
            </Badge>
          )}
          {isPending && (
            <Badge variant="outline" className="h-4 border-orange-200 text-[9px] text-orange-600">
              Pending
            </Badge>
          )}
          {isInactive && (
            <Badge variant="outline" className="h-4 text-[9px] text-gray-500">
              Inactive
            </Badge>
          )}
          {isSuspended && (
            <Badge variant="outline" className="h-4 border-red-200 text-[9px] text-red-600">
              Suspended
            </Badge>
          )}
        </div>

        {showSwitchButton && !isActive && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[10px] font-semibold"
            disabled={disabled}
            onClick={() => onSelect(company)}
          >
            Switch
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
          disabled={isDeleting}
          onClick={() => onDelete(company)}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function AddCompanyModal({ onSuccess }: AddCompanyModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await api.post<CompanyRecord>("/api/company", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const companyId = Number(response.data.id);
      const storedRecents = JSON.parse(localStorage.getItem("recent_companies") || "[]");
      const normalizedRecents = Array.isArray(storedRecents)
        ? storedRecents.map(Number).filter((id: number) => id !== companyId)
        : [];
      const updatedRecents = [companyId, ...normalizedRecents].slice(0, 5);

      localStorage.setItem("recent_companies", JSON.stringify(updatedRecents));
      toast({
        title: "Company Created",
        description: `${response.data.name} is ready to use.`,
      });

      form.reset();
      onSuccess(companyId);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error?.response?.data?.error || "Check the form details and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="flex max-h-[95vh] max-w-2xl flex-col overflow-hidden p-0">
      <div className="overflow-y-auto p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Register New Company</DialogTitle>
          <DialogDescription>
            The new company becomes your active workspace as soon as it is created.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Business Name *</Label>
            <Input name="name" required placeholder="e.g. Acme Corporation Ltd" className="h-11" />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Company Logo</Label>
            <Input name="logo" type="file" accept="image/*" className="cursor-pointer" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">TIN Number</Label>
            <Input name="tin" placeholder="9 digit code" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Registration No.</Label>
            <Input name="registration_number" placeholder="RDB Ref Number" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Currency</Label>
            <select
              name="currency"
              className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="RWF"
            >
              <option value="RWF">RWF (Francs)</option>
              <option value="USD">USD (Dollars)</option>
              <option value="EUR">EUR (Euros)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Industry Sector</Label>
            <select
              name="sector"
              className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="technology"
            >
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
            <Label className="text-xs font-bold uppercase text-gray-500">Scale</Label>
            <select
              name="size"
              className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="micro"
            >
              <option value="micro">Micro (1-10 Employees)</option>
              <option value="small">Small (11-50)</option>
              <option value="medium">Medium (51-100)</option>
              <option value="large">Large (100+)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Incorporation Date</Label>
            <Input name="incorporation_date" type="date" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Fiscal Year Start</Label>
            <Input name="fiscal_year_start" defaultValue="01-01" placeholder="MM-DD" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Tax Regime</Label>
            <Input name="tax_regime" defaultValue="General" />
          </div>

          <div className="col-span-2 flex items-center gap-2 pt-4">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Contact and Location
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Official Email</Label>
            <Input name="email" type="email" placeholder="info@company.com" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Phone Number</Label>
            <Input name="phone" placeholder="+250..." />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-500">Address</Label>
            <Input name="address" placeholder="Province, District, Sector, Cell" />
          </div>

          <Button
            disabled={submitting}
            type="submit"
            className="col-span-2 mt-2 h-12 bg-blue-600 text-md font-bold shadow-lg shadow-blue-100 hover:bg-blue-700"
          >
            {submitting ? "Processing..." : "Register and Start Working"}
          </Button>
        </form>
      </div>
    </DialogContent>
  );
}
