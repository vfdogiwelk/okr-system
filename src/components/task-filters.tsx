"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

const statuses = [
  { value: "", label: "Всі" },
  { value: "todo", label: "Нові" },
  { value: "in_progress", label: "В роботі" },
  { value: "done", label: "Готово" },
  { value: "blocked", label: "Блок" },
];

const priorities = [
  { value: "", label: "Всі" },
  { value: "critical", label: "Крит." },
  { value: "high", label: "Вис." },
  { value: "medium", label: "Серед." },
  { value: "low", label: "Низ." },
];

export function TaskFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const currentStatus = searchParams.get("status") || "";
  const currentPriority = searchParams.get("priority") || "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/tasks?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", search.trim());
  }

  return (
    <div className="flex flex-col gap-3 mb-8">
      {/* Filters row — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="flex items-center bg-gray-100 rounded-xl p-1 shrink-0">
          {statuses.map((s) => (
            <button key={s.value} onClick={() => updateParam("status", s.value)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                currentStatus === s.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-gray-100 rounded-xl p-1 shrink-0">
          {priorities.map((p) => (
            <button key={p.value} onClick={() => updateParam("priority", p.value)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                currentPriority === p.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук задач..."
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-base outline-none hover:border-gray-300 focus:border-[#6c5ce7] focus:ring-3 focus:ring-[#6c5ce7]/20 transition-all" />
        </div>
      </form>
    </div>
  );
}
