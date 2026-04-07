
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export function DashboardHeader() {
  return (
    <div className="flex-1 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
      </div>
      <div className="flex items-center gap-4">
        <NotificationCenter />
      </div>
    </div>
  );
}
