import axios from "axios";
import {
  COMPANY_BASE_URL,
  requestWithCompanyFallback,
} from "./companyApi";

export interface Notification {
  id: string;
  company_id: number;
  title: string;
  message: string;
  type: "alert" | "reminder" | "info" | "warning";
  is_read: boolean;
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at?: string;
  due_date?: string | null;
  action_url?: string | null;
}

interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

type NotificationInput = Omit<Notification, "id" | "company_id" | "is_read" | "created_at" | "updated_at">;

class NotificationService {
  static async getInbox(
    companyId?: string,
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.get<NotificationListResponse>(
        `${COMPANY_BASE_URL}/${targetId}/notifications`,
        {
          headers: { "x-company-id": targetId },
        },
      );

      return {
        notifications: response.data.notifications || [],
        unreadCount: Number(response.data.unreadCount || 0),
      };
    });
  }

  static async getNotifications(companyId?: string): Promise<Notification[]> {
    const response = await this.getInbox(companyId);
    return response.notifications;
  }

  static async getUnreadCount(companyId?: string): Promise<number> {
    const response = await this.getInbox(companyId);
    return response.unreadCount;
  }

  static async markAsRead(notificationId: string, companyId?: string): Promise<Notification> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.patch<Notification>(
        `${COMPANY_BASE_URL}/${targetId}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": targetId,
          },
        },
      );

      return response.data;
    });
  }

  static async createNotification(
    notification: NotificationInput,
    companyId?: string,
  ): Promise<Notification> {
    return requestWithCompanyFallback(companyId, async (targetId) => {
      const response = await axios.post<Notification>(
        `${COMPANY_BASE_URL}/${targetId}/notifications`,
        notification,
        {
          headers: {
            "Content-Type": "application/json",
            "x-company-id": targetId,
          },
        },
      );

      return response.data;
    });
  }
}

export default NotificationService;
