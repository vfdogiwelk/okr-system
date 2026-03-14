"use client";

import { Progress } from "@/components/ui/progress";
import { KRRow } from "./kr-row";
import { TaskItem } from "./task-item";
import { CreateTaskDialog } from "./create-task-dialog";
import { CreateKRDialog } from "./create-kr-dialog";
import { InlineEdit } from "./inline-edit";
import {
  updateObjectiveTitle,
  updateObjectiveDescription,
  deleteObjective,
  createObjective,
  updateObjectiveStatus,
  updateObjectiveOwner,
  updateObjectiveTeam,
  updateObjectiveParent,
  getAllObjectives,
  addComment,
  updateComment,
  deleteComment,
} from "@/app/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  GitBranch,
  ListTodo,
  Clock,
  Trash2,
  Network,
  MessageSquare,
  Send,
  User as UserIcon,
  Users,
  Pencil,
  Unlink,
  Link,
} from "lucide-react";
import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { User, Team } from "@/db/schema";

type UserWithTeam = User & { team: Team | null };

function timeAgo(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "щойно";
  if (mins < 60) return `${mins} хв тому`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} год тому`;
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// -- Status config --
const objectiveStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Активна", color: "#6c5ce7", bg: "#6c5ce715" },
  completed: { label: "Завершена", color: "#10b981", bg: "#10b98115" },
  cancelled: { label: "Скасована", color: "#ef4444", bg: "#ef444415" },
};

/** Map objective status to a progress bar color */
function objectiveProgressColor(status: string): string {
  switch (status) {
    case "completed": return "#10b981";
    case "cancelled": return "#ef4444";
    default: return "#6c5ce7";
  }
}

// -- Dropdown for owner/team selection (portal-based) --
function PickerDropdown({
  anchorRef,
  items,
  onSelect,
  onClose,
  title,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  items: { id: string; label: string; sublabel?: string; color?: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
  title: string;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const dropdownW = 280;
    const dropdownH = 300;
    let left = rect.left;
    if (left + dropdownW > window.innerWidth) left = window.innerWidth - dropdownW - 8;
    if (left < 8) left = 8;
    let top = rect.bottom + 8;
    if (top + dropdownH > window.innerHeight) {
      top = rect.top - dropdownH - 8;
      if (top < 8) top = 8;
    }
    setPos({ top, left });
  }, [anchorRef]);

  useEffect(() => {
    updatePos();
  }, [updatePos]);

  useEffect(() => {
    const scrollEl = document.querySelector("main");
    function handleScroll() { onClose(); }
    function handleResize() { onClose(); }
    scrollEl?.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      scrollEl?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [onClose]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose, anchorRef]);

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[100] bg-white border border-gray-200 rounded-2xl p-2 shadow-2xl max-h-72 overflow-y-auto w-[280px]"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider px-3 py-2 border-b border-gray-100 mb-1">
        {title}
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-left transition-colors min-h-[44px]"
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: item.color || "#6b7280" }}
          >
            {initials(item.label)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-700 truncate">{item.label}</div>
            {item.sublabel && <div className="text-xs text-gray-400">{item.sublabel}</div>}
          </div>
        </button>
      ))}
    </div>,
    document.body
  );
}

// -- Editable/deletable comment --
function CommentItem({ comment }: { comment: any }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    if (text.trim() && text !== comment.text) {
      startTransition(async () => { await updateComment(comment.id, text.trim()); setEditing(false); toast.success("Коментар оновлено"); });
    } else { setText(comment.text); setEditing(false); }
  }

  function remove() {
    toast("Видалити коментар?", {
      action: { label: "Видалити", onClick: async () => { await deleteComment(comment.id); router.refresh(); toast.success("Коментар видалено"); } },
      cancel: { label: "Скасувати", onClick: () => {} },
    });
  }

  return (
    <div className="flex items-start gap-3 group/comment">
      <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
        style={{ backgroundColor: comment.author?.team?.color || "#6c5ce7" }}>
        {comment.author ? initials(comment.author.name) : "?"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-gray-700">{comment.author?.name || "Невідомий"}</span>
          <span className="text-xs text-gray-300">{timeAgo(comment.createdAt) || "щойно"}</span>
          <div className="ml-auto flex items-center gap-1 sm:opacity-0 sm:group-hover/comment:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="w-11 h-11 flex items-center justify-center text-gray-300 hover:text-[#6c5ce7] rounded-lg" title="Редагувати"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={remove} disabled={isPending} className="w-11 h-11 flex items-center justify-center text-gray-300 hover:text-red-500 rounded-lg" title="Видалити"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 text-sm bg-white border-2 border-[#6c5ce7] rounded-lg px-3 py-1.5 focus:outline-none h-11" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setText(comment.text); setEditing(false); } }} />
            <button onClick={save} disabled={isPending} className="text-sm font-semibold text-[#6c5ce7] hover:underline h-11 min-w-[44px] flex items-center justify-center">Зберегти</button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
        )}
      </div>
    </div>
  );
}

export function OKRCard({
  objective,
  directReports,
  allUsers,
  allTeams,
}: {
  objective: any;
  directReports: UserWithTeam[];
  allUsers: UserWithTeam[];
  allTeams: Team[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [cascadeOpen, setCascadeOpen] = useState(false);
  const [cascadePending, startCascadeTransition] = useTransition();
  const [commentText, setCommentText] = useState("");
  const [commentPending, startCommentTransition] = useTransition();
  const [showOwnerPicker, setShowOwnerPicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [parentObjectives, setParentObjectives] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const ownerBtnRef = useRef<HTMLButtonElement>(null);
  const teamBtnRef = useRef<HTMLButtonElement>(null);
  const parentBtnRef = useRef<HTMLButtonElement>(null);

  const allTasks = objective.keyResults.flatMap((kr: any) => kr.tasks || []);
  const pct = Math.round(objective.progress * 100);
  const edited = timeAgo(objective.updatedAt);
  const statusCfg = objectiveStatusConfig[objective.status] || objectiveStatusConfig.active;
  const progColor = objectiveProgressColor(objective.status);

  async function handleTitleSave(val: string) {
    await updateObjectiveTitle(objective.id, val);
    toast.success("Ціль оновлено");
  }
  async function handleDescSave(val: string) {
    await updateObjectiveDescription(objective.id, val);
    toast.success("Опис оновлено");
  }
  function handleDelete() {
    toast("Видалити ціль та всі KR і задачі?", {
      action: { label: "Видалити", onClick: async () => { await deleteObjective(objective.id); router.refresh(); toast.success("Ціль видалено"); } },
      cancel: { label: "Скасувати", onClick: () => {} },
    });
  }

  function handleCascadeSubmit(formData: FormData) {
    startCascadeTransition(async () => {
      await createObjective(formData);
      setCascadeOpen(false);
      router.refresh();
      toast.success("Ціль каскадовано");
    });
  }

  function handleStatusChange(newStatus: string) {
    if (newStatus === objective.status) return;
    startTransition(async () => {
      await updateObjectiveStatus(objective.id, newStatus);
      router.refresh();
      toast.success(`Статус → ${objectiveStatusConfig[newStatus]?.label || newStatus}`);
    });
  }

  const handleOwnerChange = useCallback(
    (userId: string) => {
      setShowOwnerPicker(false);
      startTransition(async () => {
        await updateObjectiveOwner(objective.id, userId);
        router.refresh();
        toast.success("Власника змінено");
      });
    },
    [objective.id, router]
  );

  const handleTeamChange = useCallback(
    (teamId: string) => {
      setShowTeamPicker(false);
      startTransition(async () => {
        await updateObjectiveTeam(objective.id, teamId);
        router.refresh();
        toast.success("Команду змінено");
      });
    },
    [objective.id, router]
  );

  const closeOwnerPicker = useCallback(() => setShowOwnerPicker(false), []);
  const closeTeamPicker = useCallback(() => setShowTeamPicker(false), []);

  function handleAddComment() {
    const text = commentText.trim();
    if (!text) return;
    startCommentTransition(async () => {
      await addComment(text, objective.id);
      setCommentText("");
      router.refresh();
      toast.success("Коментар додано");
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 sm:p-5 lg:p-8">
        <div className="flex items-start gap-3 sm:gap-5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-11 h-11 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors shrink-0 rounded-lg"
          >
            {expanded ? <ChevronDown className="w-5 sm:w-6 h-5 sm:h-6" /> : <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6" />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Tags row — wraps properly on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
              {/* Team badge — clickable to change */}
              {objective.team ? (
                <button
                  ref={teamBtnRef}
                  onClick={() => setShowTeamPicker(!showTeamPicker)}
                  className="text-xs font-bold px-3 py-2 rounded-full uppercase tracking-wide hover:opacity-80 transition-opacity cursor-pointer min-h-[44px] flex items-center"
                  style={{ backgroundColor: objective.team.color + "15", color: objective.team.color }}
                  title="Клік для зміни команди"
                >
                  {objective.team.name}
                </button>
              ) : (
                <button
                  ref={teamBtnRef}
                  onClick={() => setShowTeamPicker(!showTeamPicker)}
                  className="text-xs font-bold px-3 py-2 rounded-full uppercase tracking-wide bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer min-h-[44px] flex items-center"
                  title="Призначити команду"
                >
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  Команда
                </button>
              )}

              {/* Team picker dropdown */}
              {showTeamPicker && allTeams.length > 0 && (
                <PickerDropdown
                  anchorRef={teamBtnRef}
                  items={allTeams.map((t) => ({
                    id: t.id,
                    label: t.name,
                    color: t.color,
                  }))}
                  onSelect={handleTeamChange}
                  onClose={closeTeamPicker}
                  title="Обрати команду"
                />
              )}

              {/* Status pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {(["active", "completed", "cancelled"] as const).map((s) => {
                  const cfg = objectiveStatusConfig[s];
                  const isActive = objective.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={isPending}
                      className={`text-[11px] sm:text-xs font-bold px-3 py-2 rounded-full transition-all whitespace-nowrap min-h-[44px] flex items-center ${
                        isActive
                          ? "ring-2 ring-offset-1"
                          : "opacity-40 hover:opacity-70"
                      }`}
                      style={{
                        backgroundColor: cfg.bg,
                        color: cfg.color,
                        ...(isActive ? { ringColor: cfg.color } : {}),
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-sm text-gray-300 font-medium">{objective.quarter}</span>

              {edited && (
                <span className="text-sm text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {edited}
                </span>
              )}

              {/* Cascade button */}
              <Dialog open={cascadeOpen} onOpenChange={setCascadeOpen}>
                <DialogTrigger
                  render={
                    <button className="w-11 h-11 flex items-center justify-center text-gray-300 hover:text-[#6c5ce7] transition-colors rounded-lg" title="Каскадувати ціль" />
                  }
                >
                  <Network className="w-4 h-4" />
                </DialogTrigger>
                <DialogContent className="bg-white border-gray-200 max-w-lg sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      Каскадувати ціль
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-gray-500">
                    Створити дочірню ціль від: <span className="font-semibold text-gray-700">{objective.title}</span>
                  </p>
                  <form action={handleCascadeSubmit} className="space-y-5 mt-2">
                    <input type="hidden" name="parentObjectiveId" value={objective.id} />
                    <input type="hidden" name="quarter" value={objective.quarter} />
                    <div>
                      <label className="text-sm text-gray-500 font-medium mb-1.5 block">
                        Власник (кому каскадувати) <span className="text-red-500">*</span>
                      </label>
                      <Select name="ownerId" required>
                        <SelectTrigger className="h-12 text-base border-gray-200 bg-gray-50">
                          <SelectValue placeholder="Обрати співробітника" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          {allUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id} className="text-base py-2.5">
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                  style={{ backgroundColor: u.team?.color || "#6b7280" }}
                                >
                                  {initials(u.name)}
                                </span>
                                {u.name}
                                {u.team && (
                                  <span className="text-xs text-gray-400 ml-1">({u.team.name})</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 font-medium mb-1.5 block">
                        Назва цілі <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="title"
                        required
                        placeholder="Що потрібно досягти?"
                        className="h-12 text-base border-gray-200 bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 font-medium mb-1.5 block">Опис</label>
                      <Textarea
                        name="description"
                        placeholder="Деталі цілі..."
                        className="min-h-[80px] text-base border-gray-200 bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 font-medium mb-1.5 block">Команда</label>
                      <Select name="teamId">
                        <SelectTrigger className="h-12 text-base border-gray-200 bg-gray-50">
                          <SelectValue placeholder="Обрати команду" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          {allTeams.map((t) => (
                            <SelectItem key={t.id} value={t.id} className="text-base py-2.5">
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: t.color }}
                                />
                                {t.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      disabled={cascadePending}
                      className="w-full bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white h-12 text-base font-semibold rounded-xl"
                    >
                      {cascadePending ? "Створюю..." : "Каскадувати"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <button
                onClick={handleDelete}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-200 hover:text-red-500 transition-colors"
                title="Видалити ціль"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Editable title */}
            <InlineEdit
              value={objective.title}
              onSave={handleTitleSave}
              className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug"
              tag="h2"
            />

            {/* Progress % UNDER the title on mobile, beside it on desktop */}
            <div className="mt-3 sm:hidden">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="text-3xl font-bold leading-none"
                  style={{ color: progColor }}
                >
                  {pct}<span className="text-lg text-gray-300">%</span>
                </span>
              </div>
              <Progress
                value={pct}
                className="h-2.5 rounded-full w-full [&_[data-slot=progress-indicator]]:transition-all"
                aria-valuetext={`${pct}%`}
              >
                <style>{`[data-slot="progress-indicator"] { background-color: ${progColor} !important; }`}</style>
              </Progress>
            </div>

            {/* Editable description */}
            <div className="mt-2">
              <InlineEdit
                value={objective.description || ""}
                onSave={handleDescSave}
                className="text-base text-gray-500 leading-relaxed"
                placeholder="Натисніть щоб додати опис..."
                multiline
              />
            </div>

            {/* Owner + Cascade info */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 items-center">
              {/* Owner display — clickable */}
              <button
                ref={ownerBtnRef}
                onClick={() => setShowOwnerPicker(!showOwnerPicker)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer group/owner min-h-[44px]"
                title="Клік для зміни власника"
              >
                <UserIcon className="w-4 h-4" />
                Власник:
                <span className="text-gray-600 font-medium group-hover/owner:text-[#6c5ce7] transition-colors">
                  {objective.owner?.name || "Не призначено"}
                </span>
              </button>

              {/* Owner picker dropdown */}
              {showOwnerPicker && allUsers.length > 0 && (
                <PickerDropdown
                  anchorRef={ownerBtnRef}
                  items={allUsers.map((u) => ({
                    id: u.id,
                    label: u.name,
                    sublabel: u.team?.name,
                    color: u.team?.color || "#6b7280",
                  }))}
                  onSelect={handleOwnerChange}
                  onClose={closeOwnerPicker}
                  title="Обрати власника"
                />
              )}

              {/* Parent cascade — editable */}
              {objective.parentObjective ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 min-h-[44px] flex-wrap">
                  <ArrowUpRight className="w-4 h-4" /> Від:{" "}
                  <span className="text-gray-600 font-medium">{objective.parentObjective.owner?.name}</span>
                  <span className="text-gray-300">—</span>
                  <span className="text-gray-400 break-words">{objective.parentObjective.title}</span>
                  <button onClick={() => { startTransition(async () => { await updateObjectiveParent(objective.id, null); router.refresh(); toast.success("Відв'язано від каскаду"); }); }}
                    className="w-11 h-11 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors rounded-lg" title="Відв'язати від батьківської цілі">
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button ref={parentBtnRef} onClick={async () => {
                    const allObjs = await getAllObjectives();
                    setParentObjectives(allObjs.filter((o: any) => o.id !== objective.id));
                    setShowParentPicker(true);
                  }} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-[#6c5ce7] transition-colors font-medium min-h-[44px]">
                    <Link className="w-4 h-4" /> Прив'язати до батьківської цілі
                  </button>
                  {showParentPicker && parentObjectives.length > 0 && (
                    <PickerDropdown
                      anchorRef={parentBtnRef}
                      items={parentObjectives.map((o: any) => ({ id: o.id, label: o.title, sublabel: o.owner?.name, color: o.team?.color || "#6b7280" }))}
                      onSelect={async (id) => { setShowParentPicker(false); await updateObjectiveParent(objective.id, id); router.refresh(); toast.success("Каскад встановлено"); }}
                      onClose={() => setShowParentPicker(false)}
                      title="Обрати батьківську ціль"
                    />
                  )}
                </div>
              )}
              {objective.childObjectives?.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap min-h-[44px]">
                  <GitBranch className="w-4 h-4 shrink-0" /> Каскад:
                  {objective.childObjectives.map((c: any) => (
                    <span key={c.id} className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-2 text-gray-600 font-medium group/cascade min-h-[44px]">
                      {c.owner?.name}
                      <button
                        onClick={() => { startTransition(async () => { await updateObjectiveParent(c.id, null); router.refresh(); toast.success(`${c.owner?.name} відв'язано від каскаду`); }); }}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors sm:opacity-0 sm:group-hover/cascade:opacity-100 rounded"
                        title={`Відв'язати ${c.owner?.name}`}
                      >
                        <Unlink className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress — desktop only (hidden on mobile, shown under title there) */}
          <div className="text-right shrink-0 w-24 hidden sm:block">
            <div
              className="text-4xl font-bold leading-none"
              style={{ color: progColor }}
            >
              {pct}
              <span className="text-lg text-gray-300">%</span>
            </div>
            <Progress
              value={pct}
              className="h-2.5 mt-3 rounded-full [&_[data-slot=progress-indicator]]:transition-all"
              aria-valuetext={`${pct}%`}
            >
              <style>{`[data-slot="progress-indicator"] { background-color: ${progColor} !important; }`}</style>
            </Progress>
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <>
          {/* Key Results */}
          <div className="px-4 sm:px-5 lg:px-8 py-5 sm:py-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm text-gray-400 uppercase tracking-widest font-bold">
                Ключові результати ({objective.keyResults.length})
              </h3>
              <CreateKRDialog objectiveId={objective.id} />
            </div>
            {objective.keyResults.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-base bg-white">
                Немає KR. Натисніть «Новий KR» щоб створити.
              </div>
            ) : (
              <div className="space-y-3">
                {objective.keyResults.map((kr: any) => (
                  <KRRow key={kr.id} kr={kr} />
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="px-4 sm:px-5 lg:px-8 py-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowTasks(!showTasks)}
                className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-widest font-bold hover:text-gray-600 transition-colors min-h-[44px]"
              >
                <ListTodo className="w-5 h-5" /> Задачі ({allTasks.length})
                {showTasks ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <CreateTaskDialog
                objectiveId={objective.id}
                keyResults={objective.keyResults}
                directReports={directReports}
                allUsers={allUsers}
                allTeams={allTeams}
              />
            </div>
            {showTasks && allTasks.length > 0 && (
              <div className="space-y-1">
                {allTasks.map((task: any) => (
                  <TaskItem key={task.id} task={task} allUsers={allUsers} />
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="px-4 sm:px-5 lg:px-8 py-5 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm text-gray-400 uppercase tracking-widest font-bold">
                Коментарі ({objective.comments?.length || 0})
              </h3>
            </div>

            {/* Comment list */}
            {objective.comments && objective.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {objective.comments.map((comment: any) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            )}

            {/* Add comment — full width */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Написати коментар..."
                className="flex-1 h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition-all hover:border-gray-300 focus:border-[#6c5ce7] focus:ring-3 focus:ring-[#6c5ce7]/20"
              />
              <Button
                onClick={handleAddComment}
                disabled={commentPending || !commentText.trim()}
                size="sm"
                className="bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white rounded-xl h-11 px-4 min-w-[44px]"
              >
                <Send className="w-4 h-4 mr-1.5" />
                {commentPending ? "..." : "Додати"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
