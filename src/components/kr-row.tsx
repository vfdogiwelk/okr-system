"use client";

import { Progress } from "@/components/ui/progress";
import { updateKRProgress, updateKRTitle, updateKRUnit, updateKRTarget, deleteKeyResult } from "@/app/actions";
import { useState, useTransition } from "react";
import { Pencil, Check, X, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const statusConfig: Record<string, { label: string; dot: string }> = {
  on_track: { label: "На шляху", dot: "bg-emerald-500" },
  at_risk: { label: "Під ризиком", dot: "bg-amber-500" },
  behind: { label: "Відстає", dot: "bg-red-500" },
  done: { label: "Виконано", dot: "bg-blue-500" },
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
          className={`${width} bg-white border-2 border-[#6c5ce7] rounded-lg px-3 py-1.5 text-base focus:outline-none shadow-sm`} autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") save(field); if (e.key === "Escape") cancel(); }} />
        <button onClick={() => save(field)} disabled={isPending} className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="w-4 h-4" /></button>
        <button onClick={cancel} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-400 flex items-center justify-center"><X className="w-4 h-4" /></button>
      </span>
    );
  }

  return (
    <div className="px-3 sm:px-5 py-3 sm:py-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
      <div className="flex items-start gap-4">
        <div className={`w-3 h-3 rounded-full shrink-0 mt-2 ${config.dot}`} />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {editField === "title" ? editableInput("title", title, setTitle, "text", "flex-1") : (
              <span onClick={() => setEditField("title")} className="text-lg font-semibold text-gray-800 editable-hover group/t cursor-text">
                {kr.title}<Pencil className="w-3.5 h-3.5 text-transparent group-hover/t:text-[#6c5ce7] inline ml-2" />
              </span>
            )}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.dot.replace("bg-", "text-")} bg-gray-50 border border-gray-100`}>{config.label}</span>
            {edited && <span className="text-sm text-gray-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{edited}</span>}
            <button onClick={handleDelete} className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Видалити KR"><Trash2 className="w-4 h-4" /></button>
          </div>

          {/* Progress bar + value/target/unit — ALL editable */}
          <div className="flex items-center gap-4">
            <Progress value={pct} className="flex-1 h-2.5 rounded-full" aria-valuetext={`${Math.round(pct)}%`} />

            <div className="flex items-center gap-1 shrink-0 text-base font-mono">
              {/* Current value */}
              {editField === "value" ? editableInput("value", val, setVal, "number", "w-24") : (
                <span onClick={() => setEditField("value")} className="editable-hover cursor-text font-bold text-gray-700 group/v">
                  {fmtNum(kr.currentValue)}<Pencil className="w-3 h-3 text-transparent group-hover/v:text-[#6c5ce7] inline ml-1" />
                </span>
              )}
              <span className="text-gray-300 mx-1">/</span>
              {/* Target value */}
              {editField === "target" ? editableInput("target", target, setTarget, "number", "w-24") : (
                <span onClick={() => setEditField("target")} className="editable-hover cursor-text text-gray-400 group/tg">
                  {fmtNum(kr.targetValue)}<Pencil className="w-3 h-3 text-transparent group-hover/tg:text-[#6c5ce7] inline ml-1" />
                </span>
              )}
              {/* Unit — EDITABLE! */}
              {editField === "unit" ? editableInput("unit", unit, setUnit, "text", "w-28") : (
                <span onClick={() => setEditField("unit")} className="editable-hover cursor-text text-gray-400 ml-1 group/u">
                  {kr.unit}<Pencil className="w-3 h-3 text-transparent group-hover/u:text-[#6c5ce7] inline ml-1" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className={`text-2xl font-bold w-16 text-right tabular-nums shrink-0 ${kr.score >= 0.7 ? "text-emerald-500" : kr.score >= 0.4 ? "text-amber-500" : "text-red-500"}`}>
          {Math.round(kr.score * 100)}<span className="text-sm text-gray-300">%</span>
        </div>
      </div>
    </div>
  );
}
