"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User, Team } from "@/db/schema";

type UserWithTeam = User & { team: Team | null };
const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };
const roleColors: Record<string, string> = { ceo: "#6c5ce7", director: "#3b82f6", manager: "#10b981", lead: "#f59e0b", member: "#6b7280" };

function initials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

export function UserSwitcher({ currentUser, allUsers }: { currentUser: UserWithTeam; allUsers: UserWithTeam[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function handleSwitch(userId: string | null) {
    if (!userId) return;
    await fetch("/api/switch-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 px-1">Переключити користувача</p>
      <Select value={currentUser.id} onValueChange={handleSwitch}>
        <SelectTrigger className="w-full h-11 text-sm bg-gray-50 border-gray-200 gap-3 pr-3">
          <SelectValue>
            <span className="flex items-center gap-2 truncate">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: roleColors[currentUser.role] }}>
                {initials(currentUser.name)}
              </span>
              <span className="truncate font-medium text-gray-700">{currentUser.name}</span>
              <span className="text-xs text-gray-400 shrink-0">{roleLabels[currentUser.role]}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 max-h-80 w-64">
          {allUsers.map((u) => (
            <SelectItem key={u.id} value={u.id} className="text-sm py-2.5 cursor-pointer">
              <span className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: roleColors[u.role] }}>
                  {initials(u.name)}
                </span>
                <span className="flex flex-col">
                  <span className="font-medium text-gray-800">{u.name}</span>
                  <span className="text-gray-400 text-xs">{roleLabels[u.role]} &middot; {u.team?.name}</span>
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
