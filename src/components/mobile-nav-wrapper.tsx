import { getCurrentUser, getUnreadNotificationCount } from "@/app/actions";
import { MobileNav } from "./mobile-nav";

const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };

export async function MobileNavWrapper() {
  const user = await getCurrentUser();
  if (!user) return null;
  const unreadCount = await getUnreadNotificationCount(user.id);
  return <MobileNav userName={user.name} userRole={roleLabels[user.role] || user.role} unreadCount={unreadCount} />;
}
