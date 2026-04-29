import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Calendar, Download, Filter, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ComplianceCalendarService, {
  ComplianceCalendarSummary,
  ComplianceDeadline,
} from "@/services/complianceCalendarService";

const EMPTY_SUMMARY: ComplianceCalendarSummary = {
  total: 0,
  highPriority: 0,
  mediumPriority: 0,
  completed: 0,
  overdue: 0,
};

export default function ComplianceCalendar() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [summary, setSummary] = useState<ComplianceCalendarSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    task: "",
    dueDate: "",
    priority: "medium" as "high" | "medium" | "low",
    department: "",
    description: "",
    status: "pending" as "pending" | "in-progress" | "completed" | "overdue",
    reminderDays: "3",
  });

  const loadDeadlines = async () => {
    setIsLoading(true);
    try {
      const response = await ComplianceCalendarService.getAll();
      setDeadlines(response.records);
      setSummary(response.summary);
    } catch (error) {
      console.error("Failed to load compliance calendar:", error);
      toast({
        title: "Load Failed",
        description: "Could not load compliance calendar records from the backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDeadlines();
  }, []);

  const filteredDeadlines = useMemo(() => {
    const now = new Date();
    return deadlines.filter((deadline) => {
      const dueDate = new Date(deadline.dueDate);
      if (selectedPeriod === "current-month") {
        return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
      }
      if (selectedPeriod === "next-month") {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return dueDate.getMonth() === nextMonth.getMonth() && dueDate.getFullYear() === nextMonth.getFullYear();
      }
      if (selectedPeriod === "quarter") {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        return Math.floor(dueDate.getMonth() / 3) === currentQuarter && dueDate.getFullYear() === now.getFullYear();
      }
      return dueDate.getFullYear() === now.getFullYear();
    });
  }, [deadlines, selectedPeriod]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSetReminder = (task: ComplianceDeadline) => {
    toast({
      title: "Reminder Set",
      description: `A reminder is configured ${task.reminderDays} day(s) before ${task.task}.`,
    });
  };

  const handleMarkComplete = async (deadline: ComplianceDeadline) => {
    try {
      await ComplianceCalendarService.update(deadline.id, {
        task: deadline.task,
        dueDate: deadline.dueDate,
        priority: deadline.priority,
        department: deadline.department,
        description: deadline.description,
        status: "completed",
        reminderDays: deadline.reminderDays,
      });
      await loadDeadlines();
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed.",
      });
    } catch (error) {
      console.error("Failed to update deadline status:", error);
      toast({
        title: "Update Failed",
        description: "Could not mark the task as completed.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filteredDeadlines, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `compliance-calendar-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  const handleCreateDeadline = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await ComplianceCalendarService.create({
        task: formData.task,
        dueDate: formData.dueDate,
        priority: formData.priority,
        department: formData.department,
        description: formData.description || undefined,
        status: formData.status,
        reminderDays: Number(formData.reminderDays || 3),
      });

      setFormData({
        task: "",
        dueDate: "",
        priority: "medium",
        department: "",
        description: "",
        status: "pending",
        reminderDays: "3",
      });
      setIsFormOpen(false);
      await loadDeadlines();
      toast({
        title: "Deadline Added",
        description: "Compliance deadline has been saved.",
      });
    } catch (error) {
      console.error("Failed to create deadline:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the deadline.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading compliance calendar...</p>
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
            <h1 className="text-2xl font-semibold">Compliance Calendar</h1>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="next-month">Next Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Calendar
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Deadline
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{summary.highPriority}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{summary.mediumPriority}</div>
              <div className="text-sm text-gray-600">Medium Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeadlines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                      No deadlines found for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeadlines.map((deadline) => (
                    <TableRow key={deadline.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deadline.task}</div>
                          <div className="text-sm text-gray-600">{deadline.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{deadline.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(deadline.priority)}>{deadline.priority}</Badge>
                      </TableCell>
                      <TableCell>{deadline.department}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(deadline.status)}>{deadline.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleSetReminder(deadline)}>
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void handleMarkComplete(deadline)}
                            disabled={deadline.status === "completed"}
                          >
                            Complete
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

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Compliance Deadline</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateDeadline} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task">Task</Label>
                  <Input
                    id="task"
                    value={formData.task}
                    onChange={(event) => setFormData((prev) => ({ ...prev, task: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(event) => setFormData((prev) => ({ ...prev, dueDate: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(event) => setFormData((prev) => ({ ...prev, department: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reminderDays">Reminder Days</Label>
                  <Input
                    id="reminderDays"
                    type="number"
                    min="1"
                    value={formData.reminderDays}
                    onChange={(event) => setFormData((prev) => ({ ...prev, reminderDays: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "high" | "medium" | "low") =>
                      setFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "pending" | "in-progress" | "completed" | "overdue") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Deadline</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
