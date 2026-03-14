import { getCurrentUser, getUserObjectives, getDirectReports, getAllUsers, getAllTeams } from "./actions";
import { OKRCard } from "@/components/okr-card";
import { CreateObjectiveDialog } from "@/components/create-objective-dialog";
import { DashboardFilters } from "@/components/dashboard-filters";
import { Target, TrendingUp, KeyRound, Users } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ quarter?: string; q?: string }> }) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  if (!currentUser) return <div className="p-12 text-lg text-gray-400">Користувача не знайдено</div>;

  const quarter = params.quarter || "2026-Q1";

  const [allObjectives, directReports, allUsers, allTeams] = await Promise.all([
    getUserObjectives(currentUser.id, quarter), getDirectReports(currentUser.id), getAllUsers(), getAllTeams(),
  ]);

  // Client-side search filter
  const searchQuery = (params.q || "").toLowerCase();
  const objectives = searchQuery
    ? allObjectives.filter(o => o.title.toLowerCase().includes(searchQuery) || o.description?.toLowerCase().includes(searchQuery))
    : allObjectives;

  const avgProgress = objectives.length > 0 ? objectives.reduce((s, o) => s + o.progress, 0) / objectives.length : 0;
  const totalKRs = objectives.reduce((s, o) => s + o.keyResults.length, 0);

  return (
    <div className="p-5 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">{quarter} &middot; {roleLabels[currentUser.role]} &middot; {currentUser.team?.name}</p>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">Мої цілі та результати</h1>
          {directReports.length > 0 && (
            <p className="text-base text-gray-400 mt-2 flex items-center gap-2">
              <Users className="w-5 h-5" /> {directReports.length} підлеглих: {directReports.map(r => r.name.split(" ")[0]).join(", ")}
            </p>
          )}
        </div>
        <CreateObjectiveDialog />
      </div>

      {/* Filters */}
      <Suspense>
        <DashboardFilters currentQuarter={quarter} />
      </Suspense>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-10">
        {[
          { icon: Target, label: "Активних цілей", value: objectives.length, color: "text-[#6c5ce7]" },
          { icon: KeyRound, label: "Ключових результатів", value: totalKRs, color: "text-blue-500" },
          { icon: TrendingUp, label: "Загальний прогрес", value: `${Math.round(avgProgress * 100)}%`, color: avgProgress >= 0.7 ? "text-emerald-500" : avgProgress >= 0.4 ? "text-amber-500" : "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-400 font-medium mb-2"><s.icon className="w-5 h-5" />{s.label}</div>
            <div className={`text-4xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* OKR cards */}
      {objectives.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
          <Target className="w-16 h-16 mx-auto mb-5 text-gray-200" />
          <p className="text-xl font-semibold text-gray-400 mb-2">
            {searchQuery ? `Нічого не знайдено за «${params.q}»` : "Ще немає цілей"}
          </p>
          <p className="text-base text-gray-300">
            {searchQuery ? "Спробуйте інший пошуковий запит" : "Натисніть «Нова ціль» щоб почати"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {objectives.map((obj) => <OKRCard key={obj.id} objective={obj} directReports={directReports} allUsers={allUsers} allTeams={allTeams} />)}
        </div>
      )}
    </div>
  );
}
