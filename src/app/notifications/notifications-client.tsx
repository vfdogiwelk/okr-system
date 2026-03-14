"use client";

import { useTransition } from "react";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCheck, ListTodo, TrendingUp, MessageSquare, Network, ClipboardCheck, Bell } from "lucide-react";

type NotificationType = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  linkUrl: string | null;
  read: boolean;
  createdAt: Date;
};

const typeIcons: Record<string, React.ElementType> = {
  task_assigned: ListTodo,
  task_status: ClipboardCheck,
  kr_updated: TrendingUp,
  comment: MessageSquare,
  objective_cascade: Network,
};

const typeColors: Record<string, string> = {
  task_assigned: "bg-blue-100 text-blue-600",
  task_status: "bg-emerald-100 text-emerald-600",
  kr_updated: "bg-amber-100 text-amber-600",
  comment: "bg-purple-100 text-purple-600",
  objective_cascade: "bg-indigo-100 text-indigo-600",
};

function timeAgo(date: Date): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "щойно";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} хв тому`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} год тому`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн тому`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} тижн тому`;
  return d.toLocaleDateString("uk-UA");
}

export function NotificationsClient({ notifications }: { notifications: NotificationType[] }) {
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleMarkRead(id: string) {
    startTransition(async () => {
      try {
        await markNotificationRead(id);
      } catch {
        toast.error("Помилка");
      }
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      try {
        await markAllNotificationsRead();
        toast.success("Всі сповіщення позначено прочитаними");
      } catch {
        toast.error("Помилка");
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="text-sm text-gray-500">
            <strong className="text-[#6c5ce7]">{unreadCount}</strong> непрочитаних
          </span>
          <Button size="sm" variant="ghost" onClick={handleMarkAllRead} disabled={isPending} className="text-[#6c5ce7]">
            <CheckCheck className="w-4 h-4" />
            Прочитати всі
          </Button>
        </div>
      )}

      {/* List */}
      {notifications.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-base text-gray-400">Сповіщень поки немає</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            const colorClass = typeColors[notif.type] || "bg-gray-100 text-gray-600";

            return (
              <button
                key={notif.id}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
                disabled={isPending}
                className={`w-full flex items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50 ${
                  !notif.read ? "bg-blue-50/60" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-medium ${!notif.read ? "text-gray-900" : "text-gray-600"}`}>
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#6c5ce7] shrink-0" />
                    )}
                  </div>
                  {notif.message && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{notif.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
