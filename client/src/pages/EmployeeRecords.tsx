import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Eye, Filter, Loader2, Plus, UserX, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { useToast } from "@/hooks/use-toast";
import EmployeeRecordsService, {
  EmployeeRecord,
  EmployeeSummary,
} from "@/services/employeeRecordsService";
import { API_BASE } from "@/services/companyApi";

const EMPTY_SUMMARY: EmployeeSummary = {
  totalEmployees: 0,
  activeEmployees: 0,
  inactiveEmployees: 0,
  terminatedEmployees: 0,
  averageSalary: 0,
};

export default function EmployeeRecords() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [summary, setSummary] = useState<EmployeeSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await EmployeeRecordsService.getAll();
      setEmployees(response.records);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load employees:", error);
      toast({
        title: "Load Failed",
        description: "Could not load employee records from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  const departments = useMemo(
    () => [...new Set(employees.map((employee) => employee.department))].sort(),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesStatus = filterStatus === "all" || employee.status === filterStatus;
      const matchesDepartment =
        filterDepartment === "all" || employee.department.toLowerCase() === filterDepartment.toLowerCase();
      const matchesQuery =
        query === "" ||
        employee.fullName.toLowerCase().includes(query) ||
        employee.position.toLowerCase().includes(query) ||
        employee.nationalId.toLowerCase().includes(query) ||
        employee.rssbNumber.toLowerCase().includes(query);

      return matchesStatus && matchesDepartment && matchesQuery;
    });
  }, [employees, filterDepartment, filterStatus, searchTerm]);

  const handleExport = () => {
    const payload = filteredEmployees.length ? filteredEmployees : employees;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `employee-records-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  const handleViewEmployee = (employee: EmployeeRecord) => {
    toast({
      title: employee.fullName,
      description: `${employee.position} | ${employee.department} | ${EmployeeRecordsService.formatCurrency(employee.grossSalary)}`,
    });
  };

  const handleDownloadContract = (employee: EmployeeRecord) => {
    if (!employee.contractFilePath) {
      toast({
        title: "No Contract File",
        description: `${employee.fullName} does not have a contract document uploaded yet.`,
        variant: "destructive",
      });
      return;
    }

    window.open(`${API_BASE}/${employee.contractFilePath}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading employee records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold">Employee Records</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Records
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.activeEmployees}</div>
              <div className="text-sm text-gray-600">Active Employees</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{summary.terminatedEmployees}</div>
              <div className="text-sm text-gray-600">Terminated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{departments.length}</div>
              <div className="text-sm text-gray-600">Departments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {EmployeeRecordsService.formatCurrency(summary.averageSalary)}
              </div>
              <div className="text-sm text-gray-600">Avg. Salary</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Directory
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
                  className="rounded border bg-white px-3 py-1 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
                <select
                  value={filterDepartment}
                  onChange={(event) => setFilterDepartment(event.target.value)}
                  className="rounded border bg-white px-3 py-1 text-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Search employees..."
                  className="max-w-xs"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Salary (RWF)</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>RSSB Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                      No employee records found. Add an employee to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{employee.fullName}</div>
                          <div className="text-sm text-gray-500">{employee.email || "No email"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{employee.nationalId}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {EmployeeRecordsService.formatCurrency(employee.grossSalary)}
                      </TableCell>
                      <TableCell>{employee.startDate}</TableCell>
                      <TableCell className="font-mono text-sm">{employee.rssbNumber || "Not set"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            employee.status === "active"
                              ? "bg-green-100 text-green-700"
                              : employee.status === "terminated"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                          }
                        >
                          {employee.status === "active" ? (
                            <Users className="mr-1 h-3 w-3" />
                          ) : (
                            <UserX className="mr-1 h-3 w-3" />
                          )}
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewEmployee(employee)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadContract(employee)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <EmployeeForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => void loadEmployees()}
        />
      </div>
    </div>
  );
}
