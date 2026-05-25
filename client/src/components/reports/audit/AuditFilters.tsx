
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface AuditFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  actionFilter: string;
  setActionFilter: (value: string) => void;
  moduleFilter: string;
  setModuleFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  onApplyFilters: () => void;
}

export default function AuditFilters({
  searchQuery,
  setSearchQuery,
  actionFilter,
  setActionFilter,
  moduleFilter,
  setModuleFilter,
  dateFilter,
  setDateFilter,
  onApplyFilters
}: AuditFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={actionFilter} onValueChange={setActionFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Action type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          <SelectItem value="create">Create</SelectItem>
          <SelectItem value="update">Update</SelectItem>
          <SelectItem value="delete">Delete</SelectItem>
          <SelectItem value="view">View</SelectItem>
          <SelectItem value="export">Export</SelectItem>
        </SelectContent>
      </Select>
      <Select value={moduleFilter} onValueChange={setModuleFilter}>
        <SelectTrigger>
        <SelectValue placeholder="Module" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Modules</SelectItem>
          <SelectItem value="accounting_books">Accounting Books</SelectItem>
          <SelectItem value="payroll_records">Payroll</SelectItem>
          <SelectItem value="tax_returns">Tax Returns</SelectItem>
          <SelectItem value="invoices_receipts">Invoices & Receipts</SelectItem>
          <SelectItem value="internal_audit_reports">Internal Audits</SelectItem>
          <SelectItem value="compliance_alerts">Compliance Alerts</SelectItem>
        </SelectContent>
      </Select>
      <Select value={dateFilter} onValueChange={setDateFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Time period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Last 24 hours</SelectItem>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onApplyFilters} className="w-full xl:w-auto">
        <Filter className="w-4 h-4 mr-2" />
        Apply
      </Button>
    </div>
  );
}
