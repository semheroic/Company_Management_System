import { ArrowLeft, Plus, Calendar, Download, Eye, Edit, Trash2, Users, FileText, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MeetingMinutesForm } from "@/components/forms/MeetingMinutesForm";
import MeetingMinutesService from "@/services/meetingMinutesService";
import type { MeetingMinutes } from "@/services/meetingMinutesService";
import { useToast } from "@/hooks/use-toast";

export default function MeetingMinutes() {
  const { toast } = useToast();
  const numericCompanyId = Number(localStorage.getItem("selectedCompanyId") || 0);

  const [meetings, setMeetings] = useState<MeetingMinutes[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<MeetingMinutes[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingMinutes | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<MeetingMinutes | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statistics, setStatistics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount or when companyId changes
  useEffect(() => {
    if (numericCompanyId) {
      loadMeetings();
    }
  }, [numericCompanyId]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [meetings, filterType, filterStatus, searchQuery]);

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      // Fetching specifically using the company ID from the URL
      const [meetingData, stats] = await Promise.all([
        MeetingMinutesService.getMeetings(numericCompanyId),
        MeetingMinutesService.getStatistics(numericCompanyId)
      ]);
      
      setMeetings(Array.isArray(meetingData) ? meetingData : []);
      setStatistics(stats || {});
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to fetch meetings for this company.",
        variant: "destructive",
      });
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(meetings)) return;
    
    let filtered = [...meetings];

    if (filterType !== "all") {
      filtered = filtered.filter(m => m.type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(m => m.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.chairperson.toLowerCase().includes(query) ||
        m.location.toLowerCase().includes(query)
      );
    }

    setFilteredMeetings(filtered);
  };

  const handleAddMeeting = () => {
    setEditingMeeting(null);
    setShowForm(true);
  };

  const handleEditMeeting = (meeting: MeetingMinutes) => {
    setEditingMeeting(meeting);
    setShowForm(true);
  };

  const handleViewMeeting = (meeting: MeetingMinutes) => {
    setViewingMeeting(meeting);
  };

  const handleDeleteMeeting = async (id: number) => {
    if (confirm("Are you sure you want to delete this meeting?")) {
      try {
        const success = await MeetingMinutesService.deleteMeeting(numericCompanyId, id);
        if (success) {
          toast({ title: "Success", description: "Meeting deleted successfully" });
          loadMeetings();
        }
      } catch (error) {
        toast({ title: "Error", description: "Delete failed", variant: "destructive" });
      }
    }
  };

  const handleFormSubmit = async (meetingData: any) => {
    try {
      if (editingMeeting) {
        // Pass numericCompanyId to maintain data isolation
        await MeetingMinutesService.updateMeeting(numericCompanyId, editingMeeting.id, meetingData);
        toast({ title: "Success", description: "Meeting updated successfully" });
      } else {
        // Pass numericCompanyId to link the new meeting to this specific company
        await MeetingMinutesService.addMeeting(numericCompanyId, meetingData);
        toast({ title: "Success", description: "Meeting created successfully" });
      }
      setShowForm(false);
      setEditingMeeting(null);
      loadMeetings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save meeting to database",
        variant: "destructive",
      });
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMeeting(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Scheduled': return 'secondary';
      case 'In Progress': return 'outline';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'AGM': return 'default';
      case 'EGM': return 'secondary';
      case 'Board': return 'outline';
      default: return 'outline';
    }
  };

  const exportToPDF = (meeting: MeetingMinutes) => {
    const content = `
      Meeting Minutes: ${meeting.title}
      Type: ${meeting.type} | Date: ${meeting.date}
      Location: ${meeting.location}
      Chair: ${meeting.chairperson} | Secretary: ${meeting.secretary}
      
      Attendees: ${meeting.attendees?.map(a => `${a.name} (${a.role})`).join(', ')}
      Agenda: ${meeting.agenda?.join('; ')}
      Discussions: ${meeting.discussions}
      Decisions: ${meeting.decisions?.join('; ')}
      Action Items: ${meeting.action_items?.join('; ')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title}_Minutes.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Exported to text file" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Meeting Minutes
              </h1>
              <p className="text-gray-600">Manage and track all company meetings</p>
            </div>
          </div>
          <Button onClick={handleAddMeeting}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Meeting
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{statistics.total || 0}</div>
                  <div className="text-sm text-gray-600">Total Meetings</div>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{statistics.completed || 0}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{statistics.scheduled || 0}</div>
                  <div className="text-sm text-gray-600">Scheduled</div>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{statistics.thisYear || 0}</div>
                  <div className="text-sm text-gray-600">This Year</div>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="AGM">AGM</SelectItem>
                <SelectItem value="EGM">EGM</SelectItem>
                <SelectItem value="Board">Board</SelectItem>
                <SelectItem value="Committee">Committee</SelectItem>
                <SelectItem value="Special">Special</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Meetings List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Meeting History ({filteredMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="text-center py-10">Loading meetings...</div>
            ) : (
              <div className="space-y-4">
                {filteredMeetings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No meetings found matching your criteria</p>
                  </div>
                ) : (
                  filteredMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{meeting.title}</h3>
                          <Badge variant={getTypeBadgeVariant(meeting.type)}>
                            {meeting.type}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(meeting.status)}>
                            {meeting.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span>📅 {new Date(meeting.date).toLocaleDateString()}</span>
                          <span>🕐 {meeting.time}</span>
                          <span>📍 {meeting.location}</span>
                          <span>👥 {meeting.attendees?.length || 0} attendees</span>
                          <span>👔 Chair: {meeting.chairperson}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewMeeting(meeting)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditMeeting(meeting)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => exportToPDF(meeting)}>
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Meeting Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}
              </DialogTitle>
            </DialogHeader>
            <MeetingMinutesForm
              meeting={editingMeeting || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        {/* View Meeting Dialog */}
        <Dialog open={!!viewingMeeting} onOpenChange={() => setViewingMeeting(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {viewingMeeting?.title}
              </DialogTitle>
            </DialogHeader>
            {viewingMeeting && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-1">Meeting Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Type:</strong> {viewingMeeting.type}</p>
                      <p><strong>Date:</strong> {new Date(viewingMeeting.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {viewingMeeting.time}</p>
                      <p><strong>Location:</strong> {viewingMeeting.location}</p>
                      <p><strong>Chairperson:</strong> {viewingMeeting.chairperson}</p>
                      <p><strong>Secretary:</strong> {viewingMeeting.secretary}</p>
                      <p><strong>Status:</strong> 
                        <Badge variant={getStatusBadgeVariant(viewingMeeting.status)} className="ml-2">
                          {viewingMeeting.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-1">Attendees ({viewingMeeting.attendees?.length || 0})</h3>
                    <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                      {viewingMeeting.attendees?.map((attendee, index) => (
                        <p key={index} className="p-1 bg-gray-50 rounded">
                          <span className="font-medium">{attendee.name}</span> — {attendee.role}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-1">Agenda</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {viewingMeeting.agenda?.map((item, index) => (
                      <li key={index} className="p-1">{item}</li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-1">Discussions</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded leading-relaxed whitespace-pre-wrap">{viewingMeeting.discussions}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-1">Decisions Made</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {viewingMeeting.decisions?.map((item, index) => (
                        <li key={index} className="p-1">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-1">Action Items</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {viewingMeeting.action_items?.map((item, index) => (
                        <li key={index} className="p-1 text-blue-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {viewingMeeting.next_meeting_date && (
                  <div className="pt-4 border-t">
                    <p className="text-sm">
                      <strong>Next Meeting Date:</strong> {new Date(viewingMeeting.next_meeting_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => handleEditMeeting(viewingMeeting)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Meeting
                  </Button>
                  <Button onClick={() => exportToPDF(viewingMeeting)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export as Text
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
