import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle,
  Download,
  Eye,
  Filter,
  Loader2,
  Plus,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { PayrollForm } from "@/components/forms/PayrollForm";
import { useToast } from "@/hooks/use-toast";
import EmployeeRecordsService, {
  EmployeeRecord,
} from "@/services/employeeRecordsService";
import PayrollRegisterService, {
  PayrollRecord,
  PayrollSummary,
} from "@/services/payrollRegisterService";

const EMPTY_SUMMARY: PayrollSummary = {
  totalEmployees: 0,
  totalGrossPay: 0,
  totalPaye: 0,
  totalRssbEmployee: 0,
  totalRssbEmployer: 0,
  totalNetPay: 0,
  paidCount: 0,
  unpaidCount: 0,
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.message || fallback;

export default function PayrollHR() {
  const { toast } = useToast();
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary>(EMPTY_SUMMARY);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadPageData = async () => {
    setIsLoading(true);
    try {
      const [employeeResponse, payrollResponse] = await Promise.all([
        EmployeeRecordsService.getAll(),
        PayrollRegisterService.getByMonth(selectedMonth),
      ]);

      setEmployees(employeeResponse.records);
      setPayrollRecords(payrollResponse.records);
      setPayrollSummary(payrollResponse.summary);
    } catch (error) {
      console.error("Failed to load payroll data:", error);
      toast({
        title: "Load Failed",
        description: "Could not load payroll data from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPageData();
  }, [selectedMonth]);

  const handleMarkAsPaid = async (payrollId: number) => {
    try {
      await PayrollRegisterService.markAsPaid(payrollId);
      await loadPageData();
      toast({
        title: "Payment Marked",
        description: "Payroll record has been marked as paid and reflected in the general ledger.",
      });
    } catch (error: any) {
      console.error("Failed to mark payroll record as paid:", error);
      toast({
        title: "Update Failed",
        description: getErrorMessage(error, "Could not update the payroll record."),
        variant: "destructive",
      });
    }
  };

  const handleDownloadPayslip = (record: PayrollRecord) => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(record, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute(
      "download",
      `payslip_${record.employee?.fullName || record.employeeId}_${record.month}.json`,
    );
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleExportPayroll = () => {
    const csvData = PayrollRegisterService.exportToCSV(payrollRecords);
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `payroll_${selectedMonth}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      return (
        query === "" ||
        employee.fullName.toLowerCase().includes(query) ||
        employee.position.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query)
      );
    });
  }, [employees, searchTerm]);

  const filteredPayrollRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return payrollRecords.filter((record) => {
      const employeeName = record.employee?.fullName?.toLowerCase() || "";
      const position = record.employee?.position?.toLowerCase() || "";
      const department = record.employee?.department?.toLowerCase() || "";

      return query === "" || employeeName.includes(query) || position.includes(query) || department.includes(query);
    });
  }, [payrollRecords, searchTerm]);

  const activeEmployees = employees.filter((employee) => employee.status === "active").length;
  const alerts = PayrollRegisterService.getComplianceAlerts(payrollRecords, selectedMonth);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading payroll and HR data...</p>
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
            <h1 className="text-2xl font-semibold">Payroll & HR</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEmployeeForm(true)}>
              <Users className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
            <Button variant="outline" onClick={handleExportPayroll} disabled={!payrollRecords.length}>
              <Upload className="mr-2 h-4 w-4" />
              Export Payroll
            </Button>
            <Button onClick={() => setShowPayrollForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Payroll
            </Button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="mb-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Compliance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.map((alert, index) => (
                  <div key={`${alert.type}-${index}`} className="flex items-center justify-between rounded border bg-white p-3">
                    <div>
                      <span className="font-medium">{alert.message}</span>
                      <span className="ml-2 text-sm text-gray-600">Due: {alert.dueDate}</span>
                    </div>
                    <Badge variant={alert.priority === "high" ? "destructive" : "secondary"}>
                      {alert.priority}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{activeEmployees}</div>
              <div className="text-sm text-gray-600">Active Employees</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {PayrollRegisterService.formatCurrency(payrollSummary.totalGrossPay)}
              </div>
              <div className="text-sm text-gray-600">Monthly Gross Pay</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {PayrollRegisterService.formatCurrency(payrollSummary.totalPaye)}
              </div>
              <div className="text-sm text-gray-600">Monthly PAYE</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {PayrollRegisterService.formatCurrency(
                  payrollSummary.totalRssbEmployee + payrollSummary.totalRssbEmployer,
                )}
              </div>
              <div className="text-sm text-gray-600">Monthly RSSB</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Payroll Records
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="max-w-xs"
                />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="max-w-xs"
                />
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {payrollRecords.length > 0 ? (
              filteredPayrollRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="text-right">Gross Salary</TableHead>
                      <TableHead className="text-right">PAYE</TableHead>
                      <TableHead className="text-right">RSSB</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Accounting</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayrollRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{record.employee?.fullName || "Employee"}</div>
                            <div className="text-sm text-gray-600">{record.employee?.email || "No email"}</div>
                          </div>
                        </TableCell>
                        <TableCell>{record.employee?.position || "-"}</TableCell>
                        <TableCell className="text-right">{PayrollRegisterService.formatCurrency(record.grossSalary)}</TableCell>
                        <TableCell className="text-right">{PayrollRegisterService.formatCurrency(record.paye)}</TableCell>
                        <TableCell className="text-right">{PayrollRegisterService.formatCurrency(record.rssbEmployee)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {PayrollRegisterService.formatCurrency(record.netSalary)}
                        </TableCell>
                        <TableCell>
                          <Badge className={record.paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {record.paid ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              record.accountingPostedAt
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {record.accountingPostedAt ? "Posted" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadPayslip(record)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {!record.paid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!record.accountingPostedAt}
                                title={
                                  record.accountingPostedAt
                                    ? "Mark this payroll payment as paid"
                                    : "Post this payroll month to accounting before marking payments as paid"
                                }
                                onClick={() => void handleMarkAsPaid(record.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No payroll records match "{searchTerm}".
                </div>
              )
            ) : (
              <div className="py-8 text-center">
                <div className="mb-4 text-gray-500">No payroll data for {selectedMonth}</div>
                <Button onClick={() => setShowPayrollForm(true)}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Generate Payroll for {selectedMonth}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{employee.fullName}</div>
                          <div className="text-sm text-gray-600">{employee.email || "No email"}</div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.startDate}</TableCell>
                      <TableCell className="text-right">
                        {PayrollRegisterService.formatCurrency(employee.grossSalary)}
                      </TableCell>
                      <TableCell>
                        <Badge className={employee.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toast({
                                title: employee.fullName,
                                description: `${employee.position} | ${employee.department}`,
                              })
                            }
                          >
                            <Eye className="h-4 w-4" />
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
          open={showEmployeeForm}
          onClose={() => setShowEmployeeForm(false)}
          onSuccess={() => void loadPageData()}
        />

        <PayrollForm
          open={showPayrollForm}
          onClose={() => setShowPayrollForm(false)}
          onSuccess={() => void loadPageData()}
        />
      </div>
    </div>
  );
}
