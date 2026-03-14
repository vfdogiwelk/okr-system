"use client";

import { Progress } from "@/components/ui/progress";
import { updateKRProgress, updateKRTitle, updateKRUnit, updateKRTarget, deleteKeyResult } from "@/app/actions";
import { useState, useTransition } from "react";
import { Pencil, Check, X, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const statusConfig: Record<string, { label: string; dot: string; progressColor: string }> = {
  on_track: { label: "На шляху", dot: "bg-emerald-500", progressColor: "#10b981" },
  at_risk: { label: "Під ризиком", dot: "bg-amber-500", progressColor: "#f59e0b" },
  behind: { label: "Відстає", dot: "bg-red-500", progressColor: "#ef4444" },
  done: { label: "Виконано", dot: "bg-blue-500", progressColor: "#3b82f6" },
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

function timeAgo(date: any): string | null {
  if (!date) return null;
  const d = new Date(date); const now = new Date(); const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "щойно"; if (mins < 60) return `${mins} хв тому`;
  const h = Math.floor(mins / 60); if (h < 24) return `${h} год тому`;
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

/** Map KR status to a text color for the score display */
function statusTextColor(status: string): string {
  switch (status) {
    case "on_track": return "text-emerald-500";
    case "at_risk": return "text-amber-500";
    case "behind": return "text-red-500";
    case "done": return "text-blue-500";
    default: return "text-gray-500";
  }
}

export function KRRow({ kr }: { kr: any }) {
  const [isPending, startTransition] = useTransition();
  const [editField, setEditField] = useState<null | "value" | "title" | "unit" | "target">(null);
  const [val, setVal] = useState(kr.currentValue);
  const [title, setTitle] = useState(kr.title);
  const [unit, setUnit] = useState(kr.unit);
  const [target, setTarget] = useState(kr.targetValue);
  const router = useRouter();

  const pct = Math.min((kr.currentValue / kr.targetValue) * 100, 100);
  const config = statusConfig[kr.status] || statusConfig.on_track;
  const edited = timeAgo(kr.updatedAt);

  function save(field: string) {
    startTransition(async () => {
      if (field === "value") { await updateKRProgress(kr.id, val); toast.success("Прогрес оновлено"); }
      if (field === "title" && title.trim() !== kr.title) { await updateKRTitle(kr.id, title.trim()); toast.success("Назву KR оновлено"); }
      if (field === "unit" && unit.trim() !== kr.unit) { await updateKRUnit(kr.id, unit.trim()); toast.success(`Одиниці змінено на «${unit.trim()}»`); }
      if (field === "target") { await updateKRTarget(kr.id, target); toast.success("Ціль KR оновлено"); }
      setEditField(null);
    });
  }

  function cancel() { setVal(kr.currentValue); setTitle(kr.title); setUnit(kr.unit); setTarget(kr.targetValue); setEditField(null); }

  async function handleDelete() {
    toast("Видалити ключовий результат?", {
      action: { label: "Видалити", onClick: async () => { await deleteKeyResult(kr.id); router.refresh(); toast.success("KR видалено"); } },
      cancel: { label: "Скасувати", onClick: () => {} },
    });
  }

  function editableInput(field: string, value: any, setValue: any, type: string = "text", width: string = "w-32") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <input type={type} value={value} onChange={(e) => setValue(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
          className={`${width} bg-white border-2 border-[#6c5ce7] rounded-lg px-3 py-1.5 text-base focus:outline-none shadow-sm h-11`} autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") save(field); if (e.key === "Escape") cancel(); }} />
        <button onClick={() => save(field)} disabled={isPending} className="w-11 h-11 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="w-4 h-4" /></button>
        <button onClick={cancel} className="w-11 h-11 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-400 flex items-center justify-center"><X className="w-4 h-4" /></button>
      </span>
    );
  }

  return (
    <div className="px-3 sm:px-5 py-3 sm:py-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-3 h-3 rounded-full shrink-0 mt-2 ${config.dot}`} />

        <div className="flex-1 min-w-0">
          {/* Row 1: Title + status badge */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {editField === "title" ? editableInput("title", title, setTitle, "text", "flex-1") : (
              <span onClick={() => setEditField("title")} className="text-base sm:text-lg font-semibold text-gray-800 editable-hover group/t cursor-text">
                {kr.title}<Pencil className="w-3.5 h-3.5 text-gray-300 sm:text-transparent sm:group-hover/t:text-[#6c5ce7] inline ml-2" />
              </span>
            )}
            <button
              className={`text-xs font-bold px-3 py-2 rounded-full min-h-[44px] flex items-center ${config.dot.replace("bg-", "text-")} bg-gray-50 border border-gray-100`}
            >
              {config.label}
            </button>
            {edited && <span className="text-sm text-gray-300 flex items-center gap-1 h-11"><Clock className="w-3.5 h-3.5" />{edited}</span>}
            <button onClick={handleDelete} className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-200 hover:text-red-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100" title="Видалити KR"><Trash2 className="w-4 h-4" /></button>
          </div>

          {/* Row 2: Progress bar full width */}
          <div className="mb-3">
            <Progress
              value={pct}
              className="w-full h-2.5 rounded-full [&_[data-slot=progress-indicator]]:transition-all"
              style={{ "--progress-color": config.progressColor } as React.CSSProperties}
              aria-valuetext={`${Math.round(pct)}%`}
            >
              <style>{`[data-slot="progress-indicator"] { background-color: ${config.progressColor} !important; }`}</style>
            </Progress>
          </div>

          {/* Row 3: Value / Target Unit + Score */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 text-base font-mono flex-wrap">
              {/* Current value */}
              {editField === "value" ? editableInput("value", val, setVal, "number", "w-24") : (
                <span onClick={() => setEditField("value")} className="editable-hover cursor-text font-bold text-gray-700 group/v min-h-[44px] flex items-center">
                  {fmtNum(kr.currentValue)}<Pencil className="w-3 h-3 text-gray-300 sm:text-transparent sm:group-hover/v:text-[#6c5ce7] inline ml-1" />
                </span>
              )}
              <span className="text-gray-300 mx-1">/</span>
              {/* Target value */}
              {editField === "target" ? editableInput("target", target, setTarget, "number", "w-24") : (
                <span onClick={() => setEditField("target")} className="editable-hover cursor-text text-gray-400 group/tg min-h-[44px] flex items-center">
                  {fmtNum(kr.targetValue)}<Pencil className="w-3 h-3 text-gray-300 sm:text-transparent sm:group-hover/tg:text-[#6c5ce7] inline ml-1" />
                </span>
              )}
              {/* Unit — EDITABLE! */}
              {editField === "unit" ? editableInput("unit", unit, setUnit, "text", "w-28") : (
                <span onClick={() => setEditField("unit")} className="editable-hover cursor-text text-gray-400 ml-1 group/u min-h-[44px] flex items-center">
                  {kr.unit}<Pencil className="w-3 h-3 text-gray-300 sm:text-transparent sm:group-hover/u:text-[#6c5ce7] inline ml-1" />
                </span>
              )}
            </div>

            {/* Score — color based on KR STATUS */}
            <div className={`text-2xl font-bold tabular-nums shrink-0 ml-auto ${statusTextColor(kr.status)}`}>
              {Math.round(kr.score * 100)}<span className="text-sm text-gray-300">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
