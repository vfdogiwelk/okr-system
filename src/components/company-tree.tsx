"use client";
import { useState, useRef, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight, Target, Users } from "lucide-react";

function initials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }
const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };
const roleColors: Record<string, string> = { ceo: "#6c5ce7", director: "#3b82f6", manager: "#10b981", lead: "#f59e0b", member: "#6b7280" };
const statusDots: Record<string, string> = { on_track: "bg-emerald-500", at_risk: "bg-amber-500", behind: "bg-red-500", done: "bg-blue-500" };
const depthColors = ["#6c5ce7", "#3b82f6", "#10b981", "#f59e0b"];

function ObjCard({ obj, depth, expanded, onToggle, cardRef }: { obj: any; depth: number; expanded: boolean; onToggle: () => void; cardRef?: React.Ref<HTMLDivElement> }) {
  const hasChildren = obj.childObjectives && obj.childObjectives.length > 0;
  const pct = Math.round(obj.progress * 100);
  const color = depthColors[depth % depthColors.length];

  return (
    <div ref={cardRef} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}>
      <div className="p-6 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
            style={{ backgroundColor: roleColors[obj.owner?.role] || "#6b7280" }}>
            {obj.owner ? initials(obj.owner.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-lg font-bold text-gray-900">{obj.owner?.name}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: roleColors[obj.owner?.role] || "#6b7280" }}>
                {roleLabels[obj.owner?.role] || ""}
              </span>
              {obj.team && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: obj.team.color + "15", color: obj.team.color }}>
                  {obj.team.name}
                </span>
              )}
            </div>
            <h3 className="text-lg text-gray-600 font-medium leading-snug mb-3">{obj.title}</h3>
            <div className="flex items-center gap-4">
              <Progress value={pct} className="flex-1 h-3 rounded-full" aria-valuetext={`${pct}%`} />
              <span className={`text-lg font-bold ${pct >= 70 ? "text-emerald-500" : pct >= 40 ? "text-amber-500" : "text-red-500"}`}>{pct}%</span>
            </div>
            {expanded && obj.keyResults?.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Ключові результати</div>
                {obj.keyResults.map((kr: any) => (
                  <div key={kr.id} className="flex items-center gap-3 text-base">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDots[kr.status] || "bg-gray-300"}`} />
                    <span className="flex-1 text-gray-600 truncate">{kr.title}</span>
                    <span className="text-gray-400 font-mono text-sm">{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                    <span className={`font-bold text-sm ${kr.score >= 0.7 ? "text-emerald-500" : kr.score >= 0.4 ? "text-amber-500" : "text-red-500"}`}>
                      {Math.round(kr.score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-gray-300">
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
    <div ref={containerRef} className="relative pl-10">
      {/* Vertical line: top to midpoint */}
      <div className="absolute left-0 top-0 w-0.5" style={{ backgroundColor: color + "30", height: `${midY}px` }} />
      {/* Vertical line: midpoint to bottom (hidden for last) */}
      {!isLast && <div className="absolute left-0 w-0.5 bottom-0" style={{ backgroundColor: color + "30", top: `${midY}px` }} />}
      {/* Horizontal arm */}
      <div className="absolute left-0 h-0.5" style={{ backgroundColor: color + "40", width: "2.25rem", top: `${midY}px` }} />
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
        <div className="ml-8 mt-2 space-y-3">
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
