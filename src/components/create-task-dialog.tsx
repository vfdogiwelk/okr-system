"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTask } from "@/app/actions";
import { Plus, AlertCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { User, Team } from "@/db/schema";
type UserWithTeam = User & { team: Team | null };

export function CreateTaskDialog({ objectiveId, keyResults, directReports, allUsers, allTeams, parentTaskId }: {
  objectiveId: string; keyResults: any[]; directReports: UserWithTeam[]; allUsers: UserWithTeam[]; allTeams: Team[]; parentTaskId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => { await createTask(formData); setOpen(false); router.refresh(); toast.success("Задачу створено"); });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 rounded-xl" />}>
        <Plus className="w-4 h-4 mr-1.5" />{parentTaskId ? "Підзадача" : "Нова задача"}
      </DialogTrigger>
      <DialogContent className="bg-white border-gray-200 sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-xl font-bold text-gray-900">{parentTaskId ? "Нова підзадача" : "Нова задача"}</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-5 mt-2">
          <input type="hidden" name="objectiveId" value={objectiveId} />
          {parentTaskId && <input type="hidden" name="parentTaskId" value={parentTaskId} />}

          <div>
            <label className="text-sm text-gray-500 font-medium mb-1.5 block">Назва задачі <span className="text-red-500">*</span></label>
            <Input name="title" required placeholder="Що потрібно зробити?" className="h-12 text-base border-gray-200 bg-gray-50" />
          </div>
          <div>
            <label className="text-sm text-gray-500 font-medium mb-1.5 block">Опис</label>
            <Textarea name="description" placeholder="Контекст, вимоги, посилання..." className="min-h-[100px] text-base border-gray-200 bg-gray-50" />
          </div>

          <div>
            <label className="text-sm text-gray-500 font-medium mb-1.5 flex items-center gap-1.5"><KeyRound className="w-4 h-4" />Ключовий результат</label>
            {keyResults.length > 0 ? (
              <Select name="keyResultId">
                <SelectTrigger className="h-12 text-base border-gray-200 bg-gray-50"><SelectValue placeholder="Оберіть KR" /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {keyResults.map((kr: any) => <SelectItem key={kr.id} value={kr.id} className="text-base py-2.5">{kr.title} <span className="text-gray-400 ml-2">{kr.currentValue}/{kr.targetValue} {kr.unit}</span></SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-base">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />Спочатку створіть ключовий результат
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 font-medium mb-1.5 block">Пріоритет</label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger className="h-12 text-base border-gray-200 bg-gray-50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {[{v:"low",l:"Низький",c:"bg-gray-400"},{v:"medium",l:"Середній",c:"bg-blue-500"},{v:"high",l:"Високий",c:"bg-amber-500"},{v:"critical",l:"Критичний",c:"bg-red-500"}].map(p =>
                    <SelectItem key={p.v} value={p.v} className="text-base py-2.5"><span className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${p.c}`} />{p.l}</span></SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-500 font-medium mb-1.5 block">Дедлайн</label>
              <Input type="date" name="dueDate" className="h-12 text-base border-gray-200 bg-gray-50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 font-medium mb-1.5 block">Виконавець</label>
              <Select name="assigneeId">
                <SelectTrigger className="h-12 text-base border-gray-200 bg-gray-50"><SelectValue placeholder="Призначити" /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200 max-h-60">
                  {allUsers.map(u => <SelectItem key={u.id} value={u.id} className="text-base py-2.5">{u.name} <span className="text-gray-400">({u.team?.name})</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-500 font-medium mb-1.5 block">Делегувати команді</label>
              <Select name="assignedTeamId">
                <SelectTrigger className="h-12 text-base border-gray-200 bg-gray-50"><SelectValue placeholder="Команда" /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {allTeams.map(t => <SelectItem key={t.id} value={t.id} className="text-base py-2.5"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />{t.name}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white h-12 text-base font-semibold rounded-xl">
            {isPending ? "Створюю..." : "Створити задачу"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
