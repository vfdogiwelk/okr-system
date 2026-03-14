"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

const quarters = ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"];

export function DashboardFilters({ currentQuarter }: { currentQuarter: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");

  function setQuarter(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("quarter", q);
    router.push(`/?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("q", search.trim());
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      {/* Quarter switcher */}
      <div className="flex items-center bg-gray-100 rounded-xl p-1">
        {quarters.map((q) => (
          <button
            key={q}
            onClick={() => setQuarter(q)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              currentQuarter === q
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md ml-auto">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук по цілях..."
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-base outline-none hover:border-gray-300 focus:border-[#6c5ce7] focus:ring-3 focus:ring-[#6c5ce7]/20 transition-all"
          />
        </div>
      </form>
    </div>
  );
}
