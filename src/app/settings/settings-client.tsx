"use client";

import { useState, useTransition } from "react";
import { updateUserProfile, createTeam, updateTeam, deleteTeam } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Users, User, Check, X } from "lucide-react";

const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };
const roleColors: Record<string, string> = { ceo: "#6c5ce7", director: "#3b82f6", manager: "#10b981", lead: "#f59e0b", member: "#6b7280" };

const PRESET_COLORS = ["#6c5ce7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#6b7280"];

type TeamType = { id: string; name: string; color: string; createdAt: Date };
type UserType = { id: string; name: string; email: string; role: string; team?: { id: string; name: string; color: string } | null; teamId?: string | null };

export function SettingsClient({
  currentUser,
  teams,
  allUsers,
}: {
  currentUser: UserType;
  teams: TeamType[];
  allUsers: UserType[];
}) {
  return (
    <div className="space-y-8">
      <ProfileSection user={currentUser} />
      <TeamsSection teams={teams} />
    </div>
  );
}

function ProfileSection({ user }: { user: UserType }) {
  const [isPending, startTransition] = useTransition();
  const [editingField, setEditingField] = useState<"name" | "email" | null>(null);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  function handleSave(field: "name" | "email") {
    startTransition(async () => {
      try {
        const data = field === "name" ? { name } : { email };
        await updateUserProfile(user.id, data);
        toast.success(field === "name" ? "Ім'я оновлено" : "Email оновлено");
        setEditingField(null);
      } catch {
        toast.error("Помилка збереження");
      }
    });
  }

  function handleCancel(field: "name" | "email") {
    if (field === "name") setName(user.name);
    else setEmail(user.email);
    setEditingField(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <User className="w-5 h-5 text-[#6c5ce7]" />
        Профіль
      </h2>
      <div className="space-y-5">
        {/* Name */}
        <div className="flex items-center gap-4">
          <label className="w-24 text-sm font-medium text-gray-500 shrink-0">Ім&apos;я</label>
          {editingField === "name" ? (
            <div className="flex items-center gap-2 flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 flex-1" autoFocus />
              <Button size="icon-xs" variant="ghost" onClick={() => handleSave("name")} disabled={isPending}>
                <Check className="w-4 h-4 text-emerald-600" />
              </Button>
              <Button size="icon-xs" variant="ghost" onClick={() => handleCancel("name")}>
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-base text-gray-900">{name}</span>
              <button onClick={() => setEditingField("name")} className="text-gray-400 hover:text-[#6c5ce7] transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center gap-4">
          <label className="w-24 text-sm font-medium text-gray-500 shrink-0">Email</label>
          {editingField === "email" ? (
            <div className="flex items-center gap-2 flex-1">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-10 flex-1" autoFocus />
              <Button size="icon-xs" variant="ghost" onClick={() => handleSave("email")} disabled={isPending}>
                <Check className="w-4 h-4 text-emerald-600" />
              </Button>
              <Button size="icon-xs" variant="ghost" onClick={() => handleCancel("email")}>
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-base text-gray-900">{email}</span>
              <button onClick={() => setEditingField("email")} className="text-gray-400 hover:text-[#6c5ce7] transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Role (read-only) */}
        <div className="flex items-center gap-4">
          <label className="w-24 text-sm font-medium text-gray-500 shrink-0">Роль</label>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: roleColors[user.role] }}>
            {roleLabels[user.role]}
          </span>
        </div>

        {/* Team (read-only) */}
        <div className="flex items-center gap-4">
          <label className="w-24 text-sm font-medium text-gray-500 shrink-0">Команда</label>
          {user.team ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.team.color }} />
              <span className="text-base text-gray-900">{user.team.name}</span>
            </div>
          ) : (
            <span className="text-base text-gray-400">Не призначено</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamsSection({ teams }: { teams: TeamType[] }) {
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamType | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  function handleCreate() {
    if (!newName.trim()) { toast.error("Введіть назву команди"); return; }
    startTransition(async () => {
      try {
        await createTeam(newName.trim(), newColor);
        toast.success("Команду створено");
        setNewName("");
        setNewColor(PRESET_COLORS[0]);
        setCreateOpen(false);
      } catch {
        toast.error("Помилка створення команди");
      }
    });
  }

  function handleEdit() {
    if (!editingTeam || !editName.trim()) { toast.error("Введіть назву команди"); return; }
    startTransition(async () => {
      try {
        await updateTeam(editingTeam.id, editName.trim(), editColor);
        toast.success("Команду оновлено");
        setEditingTeam(null);
      } catch {
        toast.error("Помилка оновлення");
      }
    });
  }

  function handleDelete(team: TeamType) {
    startTransition(async () => {
      try {
        await deleteTeam(team.id);
        toast.success(`Команду "${team.name}" видалено`);
      } catch {
        toast.error("Помилка видалення");
      }
    });
  }

  function openEdit(team: TeamType) {
    setEditingTeam(team);
    setEditName(team.name);
    setEditColor(team.color);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#6c5ce7]" />
          Команди
        </h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="w-4 h-4" />
            Нова команда
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити команду</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Назва</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Назва команди" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Колір</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`w-9 h-9 rounded-lg transition-all ${newColor === c ? "ring-2 ring-offset-2 ring-[#6c5ce7] scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <label className="text-sm text-gray-500">Або:</label>
                  <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                  <span className="text-sm text-gray-400 font-mono">{newColor}</span>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Скасувати</Button>
                <Button onClick={handleCreate} disabled={isPending}>Створити</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <p className="text-base text-gray-400 py-8 text-center">Команд поки немає</p>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <div key={team.id} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                <span className="text-base font-medium text-gray-900">{team.name}</span>
                <span className="text-xs text-gray-400 font-mono">{team.color}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon-xs" variant="ghost" onClick={() => openEdit(team)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon-xs" variant="ghost" onClick={() => handleDelete(team)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => { if (!open) setEditingTeam(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати команду</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Назва</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Назва команди" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Колір</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => setEditColor(c)}
                    className={`w-9 h-9 rounded-lg transition-all ${editColor === c ? "ring-2 ring-offset-2 ring-[#6c5ce7] scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <label className="text-sm text-gray-500">Або:</label>
                <Input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                <span className="text-sm text-gray-400 font-mono">{editColor}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setEditingTeam(null)}>Скасувати</Button>
              <Button onClick={handleEdit} disabled={isPending}>Зберегти</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
