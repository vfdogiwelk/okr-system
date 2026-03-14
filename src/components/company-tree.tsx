"use client";
import { useState, useRef, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight, Target, Users } from "lucide-react";

function initials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }
function fmtNum(n: number): string { if (n >= 1_000_000) return (n/1_000_000).toFixed(1).replace(/\.0$/,"")+"M"; if (n >= 1_000) return (n/1_000).toFixed(1).replace(/\.0$/,"")+"K"; return n.toString(); }
const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };
const roleColors: Record<string, string> = { ceo: "#6c5ce7", director: "#3b82f6", manager: "#10b981", lead: "#f59e0b", member: "#6b7280" };
const statusDots: Record<string, string> = { on_track: "bg-emerald-500", at_risk: "bg-amber-500", behind: "bg-red-500", done: "bg-blue-500" };
const depthColors = ["#6c5ce7", "#3b82f6", "#10b981", "#f59e0b"];

/** Map KR status to a progress color for the company tree */
function statusProgressColor(status: string): string {
  switch (status) {
    case "on_track": return "#10b981";
    case "at_risk": return "#f59e0b";
    case "behind": return "#ef4444";
    case "done": return "#3b82f6";
    default: return "#6c5ce7";
  }
}

/** Map KR status to a text color for score display */
function statusTextColor(status: string): string {
  switch (status) {
    case "on_track": return "text-emerald-500";
    case "at_risk": return "text-amber-500";
    case "behind": return "text-red-500";
    case "done": return "text-blue-500";
    default: return "text-gray-500";
  }
}

/** Derive an overall status from KRs for the progress bar color */
function deriveObjStatus(obj: any): string {
  if (!obj.keyResults || obj.keyResults.length === 0) {
    // Fall back to percentage-based if no KRs
    const pct = Math.round(obj.progress * 100);
    if (pct >= 100) return "done";
    if (pct >= 70) return "on_track";
    if (pct >= 40) return "at_risk";
    return "behind";
  }
  // If any KR is behind, the whole objective is behind
  const statuses = obj.keyResults.map((kr: any) => kr.status);
  if (statuses.includes("behind")) return "behind";
  if (statuses.includes("at_risk")) return "at_risk";
  if (statuses.every((s: string) => s === "done")) return "done";
  return "on_track";
}

function ObjCard({ obj, depth, expanded, onToggle, cardRef }: { obj: any; depth: number; expanded: boolean; onToggle: () => void; cardRef?: React.Ref<HTMLDivElement> }) {
  const hasChildren = obj.childObjectives && obj.childObjectives.length > 0;
  const pct = Math.round(obj.progress * 100);
  const color = depthColors[depth % depthColors.length];
  const objStatus = deriveObjStatus(obj);
  const progColor = statusProgressColor(objStatus);

  return (
    <div ref={cardRef} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}>
      <div className="p-3 sm:p-6 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3 sm:gap-5">
          <div className="w-8 sm:w-12 h-8 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-[10px] sm:text-sm shadow-md shrink-0"
            style={{ backgroundColor: roleColors[obj.owner?.role] || "#6b7280" }}>
            {obj.owner ? initials(obj.owner.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-gray-900">{obj.owner?.name}</span>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: roleColors[obj.owner?.role] || "#6b7280" }}>
                {roleLabels[obj.owner?.role] || ""}
              </span>
              {obj.team && (
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: obj.team.color + "15", color: obj.team.color }}>
                  {obj.team.name}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg text-gray-600 font-medium leading-snug mb-2 sm:mb-3">{obj.title}</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={pct} className="h-3 rounded-full w-full [&_[data-slot=progress-indicator]]:transition-all" aria-valuetext={`${pct}%`}>
                  <style>{`[data-slot="progress-indicator"] { background-color: ${progColor} !important; }`}</style>
                </Progress>
              </div>
              <span className="text-lg font-bold" style={{ color: progColor }}>{pct}%</span>
            </div>
            {expanded && obj.keyResults?.length > 0 && (
              <div className="mt-3 sm:mt-4 bg-gray-50 rounded-xl p-3 sm:p-4 space-y-2">
                <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold">Ключові результати</div>
                {obj.keyResults.map((kr: any) => {
                  const krColor = statusProgressColor(kr.status);
                  return (
                    <div key={kr.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm sm:text-base py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${statusDots[kr.status] || "bg-gray-300"}`} />
                        <span className="text-gray-600">{kr.title}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4 sm:ml-auto shrink-0">
                        <span className="text-gray-400 font-mono text-xs sm:text-sm whitespace-nowrap">{fmtNum(kr.currentValue)}/{fmtNum(kr.targetValue)} {kr.unit}</span>
                        <span className={`font-bold text-xs sm:text-sm ${statusTextColor(kr.status)}`}>
                          {Math.round(kr.score * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="w-11 h-11 flex items-center justify-center text-gray-300 rounded-lg">
              {hasChildren ? (expanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />) : <Target className="w-6 h-6 text-gray-200" />}
            </div>
            {hasChildren && <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-4 h-4" />{obj.childObjectives.length}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChildNode({ child, depth, color, isLast }: { child: any; depth: number; color: string; isLast: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [midY, setMidY] = useState(48);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function measure() {
      if (cardRef.current && containerRef.current) {
        const containerTop = containerRef.current.getBoundingClientRect().top;
        const cardRect = cardRef.current.getBoundingClientRect();
        const cardMid = cardRect.top + cardRect.height / 2 - containerTop;
        setMidY(cardMid);
      }
    }
    measure();
    // Re-measure when card expands/collapses
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative pl-5 sm:pl-10">
      {/* Vertical line: top to midpoint */}
      <div className="absolute left-0 top-0 w-0.5" style={{ backgroundColor: color + "30", height: `${midY}px` }} />
      {/* Vertical line: midpoint to bottom (hidden for last) */}
      {!isLast && <div className="absolute left-0 w-0.5 bottom-0" style={{ backgroundColor: color + "30", top: `${midY}px` }} />}
      {/* Horizontal arm */}
      <div className="absolute left-0 h-0.5" style={{ backgroundColor: color + "40", width: "1.25rem", top: `${midY}px` }} />
      {/* Dot */}
      <div className="absolute w-2.5 h-2.5 rounded-full border-2 bg-white" style={{ borderColor: color, left: "-5px", top: `${midY - 5}px` }} />
      <TreeNode obj={child} depth={depth + 1} cardRef={cardRef} />
    </div>
  );
}

function TreeNode({ obj, depth = 0, cardRef }: { obj: any; depth?: number; cardRef?: React.Ref<HTMLDivElement> }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = obj.childObjectives && obj.childObjectives.length > 0;
  const color = depthColors[depth % depthColors.length];

  return (
    <div>
      <ObjCard obj={obj} depth={depth} expanded={expanded} onToggle={() => setExpanded(!expanded)} cardRef={cardRef} />
      {expanded && hasChildren && (
        <div className="ml-3 sm:ml-8 mt-2 space-y-3">
          {obj.childObjectives.map((child: any, i: number) => (
            <ChildNode key={child.id} child={child} depth={depth} color={color} isLast={i === obj.childObjectives.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CompanyTree({ tree }: { tree: any[] }) {
  if (tree.length === 0) return (
    <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
      <Target className="w-16 h-16 mx-auto mb-5 text-gray-200" />
      <p className="text-xl font-semibold text-gray-400">Немає OKR компанії</p>
    </div>
  );
  return <div className="space-y-6">{tree.map(obj => <TreeNode key={obj.id} obj={obj} depth={0} />)}</div>;
}
