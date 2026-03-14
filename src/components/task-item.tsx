"use client";

import {
  updateTaskStatus,
  updateTaskTitle,
  updateTaskPriority,
  updateTaskAssignee,
  updateTaskDueDate,
  deleteTask,
} from "@/app/actions";
import { useTransition, useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Users,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Ban,
} from "lucide-react";
import type { User, Team } from "@/db/schema";

type UserWithTeam = User & { team: Team | null };

const statusIcons: Record<string, any> = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: AlertCircle,
};
const statusColors: Record<string, string> = {
  todo: "text-gray-300 hover:text-gray-500",
  in_progress: "text-blue-500 hover:text-blue-400",
  done: "text-emerald-500 hover:text-emerald-400",
  blocked: "text-red-500 hover:text-red-400",
};
const statusLabels: Record<string, string> = {
  todo: "До виконання",
  in_progress: "В роботі",
  done: "Виконано",
  blocked: "Заблоковано",
};
const priorityStyles: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-amber-50 text-amber-600",
  critical: "bg-red-50 text-red-600",
};
const priorityLabels: Record<string, string> = {
  low: "Низький",
  medium: "Середній",
  high: "Високий",
  critical: "Критичний",
};
const priorityList = ["low", "medium", "high", "critical"] as const;

// Updated status cycling: todo -> in_progress -> done -> todo, blocked -> todo
const nextStatus: Record<string, string> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
  blocked: "todo",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Dropdown that renders via portal at correct position
function AssigneeDropdown({
  anchorRef,
  allUsers,
  onSelect,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  allUsers: UserWithTeam[];
  onSelect: (userId: string) => void;
  onClose: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const dropdownW = 280;
    const dropdownH = 300;
    // Center dropdown on button, clamp to viewport
    let left = rect.left + rect.width / 2 - dropdownW / 2;
    if (left + dropdownW > window.innerWidth - 8) left = window.innerWidth - dropdownW - 8;
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
    // Close on scroll or resize
    const scrollEl = document.querySelector("main");
    function handleScroll() {
      onClose();
    }
    function handleResize() {
      onClose();
    }
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
        Обрати виконавця
      </div>
      {allUsers.map((u) => (
        <button
          key={u.id}
          onClick={() => onSelect(u.id)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-left transition-colors min-h-[44px]"
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: u.team?.color || "#6b7280" }}
          >
            {initials(u.name)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-700 truncate">{u.name}</div>
            <div className="text-xs text-gray-400">{u.team?.name}</div>
          </div>
        </button>
      ))}
    </div>,
    document.body
  );
}

export function TaskItem({
  task,
  indent = 0,
  allUsers = [],
}: {
  task: any;
  indent?: number;
  allUsers?: UserWithTeam[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showSubs, setShowSubs] = useState(false);
  const [editField, setEditField] = useState<null | "title" | "priority" | "assignee" | "dueDate">(
    null
  );
  const [title, setTitle] = useState(task.title);
  const router = useRouter();
  const assigneeBtnRef = useRef<HTMLButtonElement>(null);
  const StatusIcon = statusIcons[task.status] || Circle;
  const hasSubs = task.subtasks && task.subtasks.length > 0;

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  function cycleStatus() {
    const next = nextStatus[task.status] || "todo";
    startTransition(async () => {
      await updateTaskStatus(task.id, next);
      toast.success(`«${task.title}» → ${statusLabels[next]}`);
    });
  }

  function setBlocked() {
    if (task.status === "blocked") return;
    startTransition(async () => {
      await updateTaskStatus(task.id, "blocked");
      toast.success(`«${task.title}» → ${statusLabels.blocked}`);
    });
  }

  function saveTitle() {
    if (title.trim() && title !== task.title) {
      startTransition(async () => {
        await updateTaskTitle(task.id, title.trim());
        toast.success("Задачу оновлено");
        setEditField(null);
      });
    } else {
      setTitle(task.title);
      setEditField(null);
    }
  }

  function changePriority(p: string) {
    startTransition(async () => {
      await updateTaskPriority(task.id, p);
      toast.success(`Пріоритет → ${priorityLabels[p]}`);
      setEditField(null);
    });
  }

  const changeAssignee = useCallback(
    (userId: string) => {
      startTransition(async () => {
        await updateTaskAssignee(task.id, userId);
        toast.success("Виконавця змінено");
        setEditField(null);
      });
    },
    [task.id]
  );

  const closeAssignee = useCallback(() => setEditField(null), []);

  function changeDueDate(date: string) {
    startTransition(async () => {
      await updateTaskDueDate(task.id, date || null);
      toast.success("Дедлайн оновлено");
      setEditField(null);
    });
  }

  async function handleDelete() {
    toast("Видалити задачу?", {
      action: { label: "Видалити", onClick: async () => { await deleteTask(task.id); router.refresh(); toast.success("Задачу видалено"); } },
      cancel: { label: "Скасувати", onClick: () => {} },
    });
  }

  return (
    <div style={{ marginLeft: indent * 16 }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
        {/* Row 1: toggle + status + title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Subtask toggle — 44px touch target */}
          <div className="w-11 h-11 flex items-center justify-center shrink-0">
            {hasSubs ? (
              <button
                onClick={() => setShowSubs(!showSubs)}
                className="w-11 h-11 flex items-center justify-center text-gray-300 hover:text-gray-500 rounded-lg"
              >
                {showSubs ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            ) : null}
          </div>

          {/* Status — 44px touch target wrapping the icon */}
          <button
            onClick={cycleStatus}
            disabled={isPending}
            className={`w-11 h-11 flex items-center justify-center shrink-0 rounded-lg ${statusColors[task.status]}`}
            title={`${statusLabels[task.status]} → клік для зміни`}
          >
            <StatusIcon className="w-6 h-6" />
          </button>

          {/* Title */}
          {editField === "title" ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitle(task.title);
                  setEditField(null);
                }
              }}
              className="flex-1 min-w-0 text-base font-medium bg-white border-2 border-[#6c5ce7] rounded-lg px-3 py-1.5 focus:outline-none"
              autoFocus
            />
          ) : (
            <span
              onClick={() => setEditField("title")}
              className={`text-base font-medium flex-1 min-w-0 editable-hover cursor-text group/title ${
                task.status === "done" ? "line-through text-gray-300" : "text-gray-700"
              }`}
            >
              {task.title}
              <Pencil className="w-3.5 h-3.5 text-transparent group-hover/title:text-[#6c5ce7] inline ml-1.5 shrink-0" />
            </span>
          )}
        </div>

        {/* Row 2 on mobile: meta controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap ml-[88px] sm:ml-0">
          {/* Cross-team */}
          {task.assignedTeam && (
            <span
              className="text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1.5 shrink-0 hidden sm:flex"
              style={{
                backgroundColor: task.assignedTeam.color + "12",
                color: task.assignedTeam.color,
              }}
            >
              <Users className="w-3.5 h-3.5" />
              {task.assignedTeam.name}
            </span>
          )}

          {/* Priority */}
          {editField === "priority" ? (
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1.5 shadow-lg z-10 shrink-0 flex-wrap">
              {priorityList.map((p) => (
                <button
                  key={p}
                  onClick={() => changePriority(p)}
                  className={`text-xs font-bold px-3 py-2 rounded-lg min-h-[44px] ${priorityStyles[p]} hover:opacity-80 transition-opacity`}
                >
                  {priorityLabels[p]}
                </button>
              ))}
              <button
                onClick={() => setEditField(null)}
                className="w-11 h-11 flex items-center justify-center text-gray-300 hover:text-gray-500 ml-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditField("priority")}
              className={`text-xs font-bold px-3 py-2 rounded-full shrink-0 min-h-[44px] flex items-center ${
                priorityStyles[task.priority]
              } hover:opacity-80 cursor-pointer`}
              title="Клік для зміни пріоритету"
            >
              {priorityLabels[task.priority]}
            </button>
          )}

          {/* Due date */}
          {editField === "dueDate" ? (
            <input
              type="date"
              defaultValue={task.dueDate || ""}
              onChange={(e) => changeDueDate(e.target.value)}
              onBlur={() => setEditField(null)}
              className="text-sm bg-white border-2 border-[#6c5ce7] rounded-lg px-2.5 py-1.5 focus:outline-none shrink-0 h-11"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditField("dueDate")}
              className="text-sm text-gray-400 hover:text-gray-600 font-mono shrink-0 editable-hover cursor-text h-11 min-w-[44px] flex items-center justify-center"
              title="Клік для зміни дедлайну"
            >
              {task.dueDate || "\u2014"}
            </button>
          )}

          {/* Assignee */}
          {task.assignee ? (
            <button
              ref={assigneeBtnRef}
              onClick={() => setEditField(editField === "assignee" ? null : "assignee")}
              className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-[#6c5ce7]/30 cursor-pointer transition-all shrink-0"
              style={{ backgroundColor: "#6c5ce7" }}
              title={`${task.assignee.name} \u2014 клік для зміни`}
            >
              {initials(task.assignee.name)}
            </button>
          ) : (
            <button
              ref={assigneeBtnRef}
              onClick={() => setEditField(editField === "assignee" ? null : "assignee")}
              className="w-11 h-11 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-[#6c5ce7] hover:text-[#6c5ce7] shrink-0 transition-all"
              title="Призначити виконавця"
            >
              ?
            </button>
          )}

          {/* Assignee dropdown — portal to body */}
          {editField === "assignee" && allUsers.length > 0 && (
            <AssigneeDropdown
              anchorRef={assigneeBtnRef}
              allUsers={allUsers}
              onSelect={changeAssignee}
              onClose={closeAssignee}
            />
          )}

          {/* Subtask count */}
          {hasSubs && (
            <span className="text-xs text-gray-300 flex items-center gap-1 shrink-0 h-11">
              <GitBranch className="w-3.5 h-3.5" />
              {task.subtasks.length}
            </span>
          )}

          {/* Block/unblock button — 44px touch target */}
          <button
            onClick={() => {
              const next = task.status === "blocked" ? "todo" : "blocked";
              startTransition(async () => { await updateTaskStatus(task.id, next); toast.success(`«${task.title}» → ${statusLabels[next]}`); });
            }}
            disabled={isPending}
            className={`w-11 h-11 flex items-center justify-center rounded-lg transition-all shrink-0 ${
              task.status === "blocked"
                ? "text-red-400 hover:text-emerald-500 opacity-100"
                : "text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100"
            }`}
            title={task.status === "blocked" ? "Розблокувати" : "Заблокувати"}
          >
            <Ban className="w-4 h-4" />
          </button>

          {/* Delete — 44px touch target */}
          <button
            onClick={handleDelete}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
            title="Видалити"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSubs &&
        hasSubs &&
        task.subtasks.map((sub: any) => (
          <TaskItem key={sub.id} task={sub} indent={indent + 1} allUsers={allUsers} />
        ))}
    </div>
  );
}
