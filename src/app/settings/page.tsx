import { getCurrentUser, getAllTeams, getAllUsers } from "@/app/actions";
import { Settings } from "lucide-react";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return <div className="p-12 text-lg text-gray-400">Користувача не знайдено</div>;

  const [teams, allUsers] = await Promise.all([getAllTeams(), getAllUsers()]);

  return (
    <div className="p-5 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-10">
        <p className="text-sm text-gray-400 font-medium mb-1">{roleLabels[currentUser.role]} &middot; {currentUser.team?.name}</p>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <Settings className="w-9 h-9 text-[#6c5ce7]" />Налаштування
        </h1>
      </div>
      <SettingsClient currentUser={currentUser} teams={teams} allUsers={allUsers} />
    </div>
  );
}
