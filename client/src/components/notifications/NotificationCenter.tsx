import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotificationService, { Notification } from "@/services/notificationService";

export function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const inbox = await NotificationService.getInbox();
      setNotifications(inbox.notifications);
      setUnreadCount(inbox.unreadCount);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadNotifications();
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await NotificationService.markAsRead(notification.id);
      }

      await loadNotifications();

      if (notification.action_url) {
        setIsOpen(false);
        navigate(notification.action_url);
      }
    } catch (error) {
      console.error("Failed to update notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "reminder":
        return <Clock className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-orange-500";
      case "low":
        return "border-l-blue-500";
      default:
        return "border-l-gray-300";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`cursor-pointer border-l-4 p-4 hover:bg-gray-50 ${getPriorityColor(notification.priority)} ${
                        !notification.is_read ? "bg-blue-50" : "bg-white"
                      }`}
                      onClick={() => void handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-600">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
