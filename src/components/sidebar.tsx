import { getAllUsers, getCurrentUser, getUnreadNotificationCount } from "@/app/actions";
import { UserSwitcher } from "./user-switcher";
import { Target, LayoutDashboard, Network, ListTodo, Bell, Settings } from "lucide-react";
import Link from "next/link";

const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };
const roleColors: Record<string, string> = { ceo: "#6c5ce7", director: "#3b82f6", manager: "#10b981", lead: "#f59e0b", member: "#6b7280" };

export async function Sidebar() {
  const [currentUser, allUsers] = await Promise.all([getCurrentUser(), getAllUsers()]);
  if (!currentUser) return null;

  const unreadCount = await getUnreadNotificationCount(currentUser.id);

  const navItems = [
    { href: "/", label: "Мої OKR", icon: LayoutDashboard },
    { href: "/tasks", label: "Мої задачі", icon: ListTodo },
    { href: "/company", label: "OKR компанії", icon: Network },
    { href: "/notifications", label: "Сповіщення", icon: Bell, badge: unreadCount },
    { href: "/settings", label: "Налаштування", icon: Settings },
  ];

  return (
    <aside className="w-[280px] border-r border-gray-200 bg-white flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6c5ce7] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">OKR System</h1>
            <p className="text-xs text-gray-400">Міряй Важливе</p>
          </div>
        </div>
      </div>

      {/* Current user */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: roleColors[currentUser.role] }}>
            {currentUser.name.split(" ").map(w => w[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900 truncate">{currentUser.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: roleColors[currentUser.role] }}>
                {roleLabels[currentUser.role]}
              </span>
              <span className="text-xs text-gray-400">{currentUser.team?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium">
            <item.icon className="w-5 h-5 group-hover:text-[#6c5ce7]" />
            {item.label}
            {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
              <span className="ml-auto text-xs font-bold bg-[#6c5ce7] text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Switcher */}
      <div className="px-4 py-4 border-t border-gray-100">
        <UserSwitcher currentUser={currentUser} allUsers={allUsers} />
      </div>
    </aside>
  );
}
