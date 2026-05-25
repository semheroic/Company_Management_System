
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

interface ReportsHeaderProps {
  selectedPeriod: string;
  setSelectedPeriod: (value: string) => void;
  selectedRole: string;
  setSelectedRole: (value: string) => void;
}

export default function ReportsHeader({ 
  selectedPeriod, 
  setSelectedPeriod, 
  selectedRole, 
  setSelectedRole 
}: ReportsHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Reports & Audit</h1>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">Current Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="View as" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner/CEO</SelectItem>
            <SelectItem value="accountant">Accountant</SelectItem>
            <SelectItem value="hr">HR Officer</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
