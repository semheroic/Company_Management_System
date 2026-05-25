
import { Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Deadline {
  id: number;
  task: string;
  dueDate: string;
  priority: string;
  department: string;
  description: string;
  reminderDays: number;
  status: string;
}

interface UpcomingDeadlinesProps {
  upcomingDeadlines: Deadline[];
  onMarkComplete?: (deadlineId: number) => void;
}

export default function UpcomingDeadlines({ upcomingDeadlines, onMarkComplete }: UpcomingDeadlinesProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Deadlines & Tasks
          </CardTitle>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingDeadlines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-500">
                    No upcoming deadlines in the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                upcomingDeadlines.map((deadline, index) => (
                  <TableRow key={index}>
                    <TableCell className="min-w-[220px] font-medium">{deadline.task}</TableCell>
                    <TableCell className="whitespace-nowrap">{deadline.dueDate}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(deadline.priority)}>
                        {deadline.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{deadline.department}</TableCell>
                    <TableCell>
                      <div className="flex min-w-[190px] flex-col gap-2 sm:flex-row">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" onClick={() => onMarkComplete?.(deadline.id)}>
                          Mark Complete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
