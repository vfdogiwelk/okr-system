import { getCurrentUser, getUserNotifications } from "@/app/actions";
import { Bell } from "lucide-react";
import { NotificationsClient } from "./notifications-client";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return <div className="p-12 text-lg text-gray-400">Користувача не знайдено</div>;

  const notifications = await getUserNotifications(currentUser.id);

  return (
    <div className="p-5 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-10">
        <p className="text-sm text-gray-400 font-medium mb-1">{roleLabels[currentUser.role]} &middot; {currentUser.team?.name}</p>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <Bell className="w-9 h-9 text-[#6c5ce7]" />Сповіщення
        </h1>
        <div className="flex gap-6 mt-3 text-sm text-gray-400">
          <span><strong className="text-gray-700">{notifications.length}</strong> всього</span>
          <span><strong className="text-[#6c5ce7]">{notifications.filter(n => !n.read).length}</strong> непрочитаних</span>
        </div>
      </div>
      <NotificationsClient notifications={notifications} />
    </div>
  );
}
