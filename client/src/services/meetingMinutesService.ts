import axios from 'axios';

export interface Attendee {
  id: string;
  name: string;
  role: string;
}

export interface MeetingMinutes {
  id: number;
  company_id: number;
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
  action_items: string[]; // Aligned with Backend
  next_meeting_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

class MeetingMinutesService {
  private static getHeaders(companyId: number) {
    return { 'x-company-id': companyId.toString() };
  }

  static async getMeetings(companyId: number): Promise<MeetingMinutes[]> {
    const res = await axios.get(`${API_BASE_URL}/company/${companyId}/meetings`, {
      headers: this.getHeaders(companyId)
    });
    return res.data;
  }

  static async addMeeting(companyId: number, data: any): Promise<MeetingMinutes> {
    const res = await axios.post(`${API_BASE_URL}/company/${companyId}/meetings`, data, {
      headers: this.getHeaders(companyId)
    });
    return res.data;
  }

  static async updateMeeting(companyId: number, meetingId: number, data: any): Promise<MeetingMinutes> {
    const res = await axios.put(`${API_BASE_URL}/company/${companyId}/meetings/${meetingId}`, data, {
      headers: this.getHeaders(companyId)
    });
    return res.data;
  }

  static async deleteMeeting(companyId: number, meetingId: number): Promise<boolean> {
    const res = await axios.delete(`${API_BASE_URL}/company/${companyId}/meetings/${meetingId}`, {
      headers: this.getHeaders(companyId)
    });
    return res.data.success;
  }

  static async getStatistics(companyId: number) {
    const res = await axios.get(`${API_BASE_URL}/company/${companyId}/meetings/stats`, {
      headers: this.getHeaders(companyId)
    });
    return res.data;
  }
}

export default MeetingMinutesService;