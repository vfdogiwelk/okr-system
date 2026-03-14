"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createObjective, getAllTeams } from "@/app/actions";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Team } from "@/db/schema";

export function CreateObjectiveDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [teams, setTeams] = useState<Team[]>([]);
  const router = useRouter();
  useEffect(() => { if (open) getAllTeams().then(setTeams); }, [open]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => { await createObjective(formData); setOpen(false); router.refresh(); toast.success("Ціль створено"); });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white h-11 px-5 text-base font-semibold rounded-xl" />}>
        <Plus className="w-5 h-5 mr-2" />Нова ціль
      </DialogTrigger>
      <DialogContent className="bg-white border-gray-200 max-w-lg sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-xl font-bold text-gray-900">Нова ціль (Objective)</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-5 mt-2">
          <div>
            <label className="text-sm text-gray-500 font-medium mb-1.5 block">Назва цілі <span className="text-red-500">*</span></label>
            <Input name="title" required placeholder="Що потрібно досягти?" className="h-12 text-base border-gray-200 bg-gray-50" />
          </div>
          <div>
            <label className="text-sm text-gray-500 font-medium mb-1.5 block">Опис</label>
            <Textarea name="description" placeholder="Чому ця ціль важлива?" className="min-h-[100px] text-base border-gray-200 bg-gray-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 font-medium mb-1.5 block">Команда</label>
              <Select name="teamId">
                <SelectTrigger className="h-12 text-base border-gray-200 bg-gray-50"><SelectValue placeholder="Обрати" /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {teams.map(t => <SelectItem key={t.id} value={t.id} className="text-base py-2.5"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />{t.name}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-500 font-medium mb-1.5 block">Квартал</label>
              <Select name="quarter" defaultValue="2026-Q1">
                <SelectTrigger className="h-12 text-base border-gray-200 bg-gray-50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {["2026-Q1","2026-Q2","2026-Q3","2026-Q4"].map(q => <SelectItem key={q} value={q} className="text-base py-2.5">{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={isPending} className="w-full bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white h-12 text-base font-semibold rounded-xl">
            {isPending ? "Створюю..." : "Створити ціль"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
