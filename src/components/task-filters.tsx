"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { useState } from "react";

const statuses = [
  { value: "", label: "Всі" },
  { value: "todo", label: "До виконання" },
  { value: "in_progress", label: "В роботі" },
  { value: "done", label: "Виконано" },
  { value: "blocked", label: "Заблоковано" },
];

const priorities = [
  { value: "", label: "Всі" },
  { value: "critical", label: "Критичний" },
  { value: "high", label: "Високий" },
  { value: "medium", label: "Середній" },
  { value: "low", label: "Низький" },
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
    <div className="flex flex-wrap items-center gap-3 mb-8">
      {/* Status filter */}
      <div className="flex items-center bg-gray-100 rounded-xl p-1">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParam("status", s.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentStatus === s.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Priority filter */}
      <div className="flex items-center bg-gray-100 rounded-xl p-1">
        {priorities.map((p) => (
          <button
            key={p.value}
            onClick={() => updateParam("priority", p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentPriority === p.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm ml-auto">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук задач..."
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-base outline-none hover:border-gray-300 focus:border-[#6c5ce7] focus:ring-3 focus:ring-[#6c5ce7]/20 transition-all"
          />
        </div>
      </form>
    </div>
  );
}
