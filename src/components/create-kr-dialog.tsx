"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createKeyResult } from "@/app/actions";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

export function CreateKRDialog({ objectiveId }: { objectiveId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => { await createKeyResult(formData); setOpen(false); router.refresh(); toast.success("Ключовий результат створено"); });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 rounded-xl" />}>
        <KeyRound className="w-4 h-4 mr-1.5" />Новий KR
      </DialogTrigger>
      <DialogContent className="bg-white border-gray-200 max-w-md">
        <DialogHeader><DialogTitle className="text-xl font-bold text-gray-900">Новий ключовий результат</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-5 mt-2">
          <input type="hidden" name="objectiveId" value={objectiveId} />
          <div>
            <label className="text-sm text-gray-500 font-medium mb-1.5 block">Назва KR <span className="text-red-500">*</span></label>
            <Input name="title" required placeholder="Наприклад: Залучити 500 клієнтів" className="h-12 text-base border-gray-200 bg-gray-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 font-medium mb-1.5 block">Цільове значення</label>
              <Input name="targetValue" type="number" required defaultValue={100} className="h-12 text-base border-gray-200 bg-gray-50" />
            </div>
            <div>
              <label className="text-sm text-gray-500 font-medium mb-1.5 block">Одиниця виміру</label>
              <Input name="unit" required defaultValue="%" placeholder="%, $, клієнтів" className="h-12 text-base border-gray-200 bg-gray-50" />
            </div>
          </div>
          <Button type="submit" disabled={isPending} className="w-full bg-[#6c5ce7] hover:bg-[#5a4bd6] text-white h-12 text-base font-semibold rounded-xl">
            {isPending ? "Створюю..." : "Створити KR"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
