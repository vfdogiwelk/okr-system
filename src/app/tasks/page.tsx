import { getCurrentUser, getUserTasks, getAllUsers } from "@/app/actions";
import { TaskBoard } from "@/components/task-board";
import { TaskFilters } from "@/components/task-filters";
import { ListTodo } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
const roleLabels: Record<string, string> = { ceo: "CEO", director: "Директор", manager: "Менеджер", lead: "Тімлід", member: "Спеціаліст" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string; priority?: string; q?: string }> }) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  if (!currentUser) return <div className="p-12 text-lg text-gray-400">Користувача не знайдено</div>;

  const [allTasks, allUsers] = await Promise.all([getUserTasks(currentUser.id), getAllUsers()]);

  let myTasks = allTasks.filter(t => t.assigneeId === currentUser.id);
  let delegated = allTasks.filter(t => t.createdById === currentUser.id && t.assigneeId !== currentUser.id);

  // Apply filters
  const sq = (params.q || "").toLowerCase();
  if (sq) {
    myTasks = myTasks.filter(t => t.title.toLowerCase().includes(sq));
    delegated = delegated.filter(t => t.title.toLowerCase().includes(sq));
  }
  if (params.status) {
    myTasks = myTasks.filter(t => t.status === params.status);
    delegated = delegated.filter(t => t.status === params.status);
  }
  if (params.priority) {
    myTasks = myTasks.filter(t => t.priority === params.priority);
    delegated = delegated.filter(t => t.priority === params.priority);
  }

  return (
    <div className="p-5 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium mb-1">{roleLabels[currentUser.role]} &middot; {currentUser.team?.name}</p>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <ListTodo className="w-9 h-9 text-blue-500" />Мої задачі
        </h1>
        <div className="flex gap-6 mt-3 text-sm text-gray-400">
          <span><strong className="text-gray-700">{myTasks.length}</strong> призначено мені</span>
          <span><strong className="text-blue-500">{myTasks.filter(t => t.status === "in_progress").length}</strong> в роботі</span>
          <span><strong className="text-emerald-500">{myTasks.filter(t => t.status === "done").length}</strong> виконано</span>
          <span><strong className="text-gray-700">{delegated.length}</strong> делеговано</span>
        </div>
      </div>

      <Suspense>
        <TaskFilters />
      </Suspense>

      <TaskBoard myTasks={myTasks} delegatedTasks={delegated} currentUserId={currentUser.id} allUsers={allUsers} />
    </div>
  );
}
