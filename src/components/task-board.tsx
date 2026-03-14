"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskItem } from "./task-item";
import { ListTodo, Send, ArrowUpRight } from "lucide-react";
import type { User, Team } from "@/db/schema";

type UserWithTeam = User & { team: Team | null };

export function TaskBoard({ myTasks, delegatedTasks, currentUserId, allUsers = [] }: {
  myTasks: any[]; delegatedTasks: any[]; currentUserId: string; allUsers?: UserWithTeam[];
}) {
  const groups = [
    { key: "in_progress", label: "В роботі", dot: "bg-blue-500" },
    { key: "todo", label: "До виконання", dot: "bg-gray-300" },
    { key: "blocked", label: "Заблоковано", dot: "bg-red-500" },
    { key: "done", label: "Виконано", dot: "bg-emerald-500" },
  ];

  function renderGroup(tasks: any[]) {
    return groups.map(g => {
      const t = tasks.filter(t => t.status === g.key);
      if (!t.length) return null;
      return (
        <div key={g.key} className="mb-8">
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className={`w-3 h-3 rounded-full ${g.dot}`} />
            <h3 className="text-base font-bold text-gray-600">{g.label}</h3>
            <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-lg font-mono">{t.length}</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 space-y-1">
            {t.map(task => (
              <div key={task.id}>
                <TaskItem task={task} allUsers={allUsers} />
                {task.objective && (
                  <div className="ml-16 mb-2 flex items-center gap-2 text-sm text-gray-300">
                    <ArrowUpRight className="w-4 h-4 shrink-0" /><span className="break-words">{task.objective.title}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    });
  }

  return (
    <Tabs defaultValue="mine">
      <TabsList className="mb-8">
        <TabsTrigger value="mine">
          <ListTodo className="w-5 h-5" /> Мої задачі <span className="text-sm text-gray-400 ml-1">{myTasks.length}</span>
        </TabsTrigger>
        <TabsTrigger value="delegated">
          <Send className="w-5 h-5" /> Делеговані <span className="text-sm text-gray-400 ml-1">{delegatedTasks.length}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="mine">
        {myTasks.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <ListTodo className="w-16 h-16 mx-auto mb-5 text-gray-200" />
            <p className="text-xl font-semibold text-gray-400">Немає задач</p>
          </div>
        ) : renderGroup(myTasks)}
      </TabsContent>
      <TabsContent value="delegated">
        {delegatedTasks.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <Send className="w-16 h-16 mx-auto mb-5 text-gray-200" />
            <p className="text-xl font-semibold text-gray-400">Немає делегованих</p>
          </div>
        ) : renderGroup(delegatedTasks)}
      </TabsContent>
    </Tabs>
  );
}
