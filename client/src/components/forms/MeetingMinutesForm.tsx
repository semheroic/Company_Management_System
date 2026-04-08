import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Attendee {
  id: string;
  name: string;
  role: string;
}

interface MeetingData {
  id?: number;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  chairperson: string;
  secretary: string;
  attendees: Attendee[];
  agenda: string[];
  discussions: string;
  decisions: string[];
  action_items: string[]; // Aligned with backend snake_case
  next_meeting_date: string; // Aligned with backend snake_case
  status: string;
}

interface MeetingMinutesFormProps {
  meeting?: MeetingData;
  onSubmit: (data: MeetingData) => void;
  onCancel: () => void;
}

export function MeetingMinutesForm({ meeting, onSubmit, onCancel }: MeetingMinutesFormProps) {
  const { companyId } = useParams();
  const { toast } = useToast();

  // Initialize state with backend-compatible naming
  const [formData, setFormData] = useState<MeetingData>({
    title: meeting?.title || '',
    type: meeting?.type || 'Board',
    date: meeting?.date || '',
    time: meeting?.time || '',
    location: meeting?.location || '',
    chairperson: meeting?.chairperson || '',
    secretary: meeting?.secretary || '',
    attendees: meeting?.attendees || [{ id: '1', name: '', role: '' }],
    agenda: meeting?.agenda || [''],
    discussions: meeting?.discussions || '',
    decisions: meeting?.decisions || [''],
    action_items: meeting?.action_items || [''],
    next_meeting_date: meeting?.next_meeting_date || '',
    status: meeting?.status || 'Scheduled',
    ...meeting
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof MeetingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAttendee = () => {
    const newAttendee: Attendee = {
      id: Date.now().toString(),
      name: '',
      role: ''
    };
    setFormData(prev => ({
      ...prev,
      attendees: [...prev.attendees, newAttendee]
    }));
  };

  const removeAttendee = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(attendee => attendee.id !== id)
    }));
  };

  const updateAttendee = (id: string, field: 'name' | 'role', value: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.map(attendee =>
        attendee.id === id ? { ...attendee, [field]: value } : attendee
      )
    }));
  };

  const addListItem = (field: 'agenda' | 'decisions' | 'action_items') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeListItem = (field: 'agenda' | 'decisions' | 'action_items', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateListItem = (field: 'agenda' | 'decisions' | 'action_items', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Filter out empty items
      // 2. EXPLICITLY include the companyId from the URL
      const cleanedData: MeetingData = {
        ...formData,
        company_id: Number(companyId), // Ensure this matches backend expectation
        agenda: formData.agenda.filter(item => item.trim() !== ''),
        decisions: formData.decisions.filter(item => item.trim() !== ''),
        action_items: formData.action_items.filter(item => item.trim() !== ''),
        attendees: formData.attendees.filter(attendee => attendee.name.trim() !== '')
      };

      await onSubmit(cleanedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem processing your request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meeting Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Annual General Meeting 2026"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Meeting Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGM">Annual General Meeting</SelectItem>
                  <SelectItem value="EGM">Extraordinary General Meeting</SelectItem>
                  <SelectItem value="Board">Board Meeting</SelectItem>
                  <SelectItem value="Committee">Committee Meeting</SelectItem>
                  <SelectItem value="Special">Special Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Conference Room A"
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="chairperson">Chairperson</Label>
              <Input
                id="chairperson"
                value={formData.chairperson}
                onChange={(e) => handleInputChange('chairperson', e.target.value)}
                placeholder="Name of chairperson"
                required
              />
            </div>

            <div>
              <Label htmlFor="secretary">Secretary</Label>
              <Input
                id="secretary"
                value={formData.secretary}
                onChange={(e) => handleInputChange('secretary', e.target.value)}
                placeholder="Name of secretary"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Attendees
            <Button type="button" onClick={addAttendee} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Attendee
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.attendees.map((attendee) => (
              <div key={attendee.id} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Name</Label>
                  <Input
                    value={attendee.name}
                    onChange={(e) => updateAttendee(attendee.id, 'name', e.target.value)}
                    placeholder="Attendee name"
                  />
                </div>
                <div className="flex-1">
                  <Label>Role</Label>
                  <Input
                    value={attendee.role}
                    onChange={(e) => updateAttendee(attendee.id, 'role', e.target.value)}
                    placeholder="Role/Position"
                  />
                </div>
                {formData.attendees.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttendee(attendee.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Agenda
            <Button type="button" onClick={() => addListItem('agenda')} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.agenda.map((item, index) => (
              <div key={index} className="flex gap-3 items-center">
                <div className="flex-1">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem('agenda', index, e.target.value)}
                    placeholder={`Agenda item ${index + 1}`}
                  />
                </div>
                {formData.agenda.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeListItem('agenda', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discussions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.discussions}
            onChange={(e) => handleInputChange('discussions', e.target.value)}
            placeholder="Summary of discussions held during the meeting..."
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Decisions Made
            <Button type="button" onClick={() => addListItem('decisions')} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Decision
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.decisions.map((item, index) => (
              <div key={index} className="flex gap-3 items-center">
                <div className="flex-1">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem('decisions', index, e.target.value)}
                    placeholder={`Decision ${index + 1}`}
                  />
                </div>
                {formData.decisions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeListItem('decisions', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Action Items
            <Button type="button" onClick={() => addListItem('action_items')} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Action
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.action_items.map((item, index) => (
              <div key={index} className="flex gap-3 items-center">
                <div className="flex-1">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem('action_items', index, e.target.value)}
                    placeholder={`Action item ${index + 1}`}
                  />
                </div>
                {formData.action_items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeListItem('action_items', index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Meeting</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="next_meeting_date">Next Meeting Date</Label>
            <Input
              id="next_meeting_date"
              type="date"
              value={formData.next_meeting_date}
              onChange={(e) => handleInputChange('next_meeting_date', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : meeting ? 'Update Meeting' : 'Create Meeting'}
        </Button>
      </div>
    </form>
  );
}