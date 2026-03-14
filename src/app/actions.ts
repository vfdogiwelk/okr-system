"use server";

import { db } from "@/db";
import { objectives, keyResults, tasks, users, teams, comments, notifications } from "@/db/schema";
import { eq, or, isNull, like, and, desc, asc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function uid() { return crypto.randomUUID().slice(0, 8); }

// ══════════════════════════════════════
// QUERIES
// ══════════════════════════════════════

export async function getAllUsers() {
  return db.query.users.findMany({ with: { team: true }, orderBy: (u, { asc }) => [asc(u.name)] });
}

export async function getAllTeams() {
  return db.query.teams.findMany({ orderBy: (t, { asc }) => [asc(t.name)] });
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  return db.query.users.findFirst({ where: eq(users.id, userId), with: { team: true } });
}

export async function getUserObjectives(userId: string, quarter?: string) {
  return db.query.objectives.findMany({
    where: quarter
      ? and(eq(objectives.ownerId, userId), eq(objectives.quarter, quarter))
      : eq(objectives.ownerId, userId),
    with: {
      keyResults: { with: { tasks: { with: { assignee: true, subtasks: { with: { assignee: true } }, assignedTeam: true } } } },
      parentObjective: { with: { owner: true } },
      childObjectives: { with: { owner: true, keyResults: true } },
      owner: { with: { team: true } },
      team: true,
      comments: { with: { author: true }, orderBy: (c, { desc }) => [desc(c.createdAt)] },
    },
    orderBy: (o, { desc }) => [desc(o.createdAt)],
  });
}

export async function getUserTasks(userId: string) {
  return db.query.tasks.findMany({
    where: or(eq(tasks.assigneeId, userId), eq(tasks.createdById, userId)),
    with: {
      keyResult: { with: { objective: true } }, objective: true, assignee: true, createdBy: true,
      assignedTeam: true, subtasks: { with: { assignee: true } }, parentTask: true,
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

export async function getDirectReports(userId: string) {
  return db.query.users.findMany({ where: eq(users.managerId, userId), with: { team: true } });
}

export async function getCompanyOKRTree() {
  return db.query.objectives.findMany({
    where: isNull(objectives.parentObjectiveId),
    with: {
      owner: { with: { team: true } }, team: true, keyResults: true,
      childObjectives: {
        with: {
          owner: { with: { team: true } }, team: true, keyResults: true,
          childObjectives: {
            with: { owner: { with: { team: true } }, team: true, keyResults: true },
          },
        },
      },
    },
  });
}

export async function getUserNotifications(userId: string) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: (n, { desc }) => [desc(n.createdAt)],
  });
}

export async function getUnreadNotificationCount(userId: string) {
  const all = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, userId), eq(notifications.read, false)),
  });
  return all.length;
}

export async function searchObjectives(query: string) {
  return db.query.objectives.findMany({
    where: like(objectives.title, `%${query}%`),
    with: { owner: { with: { team: true } }, team: true, keyResults: true },
    orderBy: (o, { desc }) => [desc(o.createdAt)],
  });
}

export async function getObjectiveComments(objectiveId: string) {
  return db.query.comments.findMany({
    where: eq(comments.objectiveId, objectiveId),
    with: { author: true },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

// ══════════════════════════════════════
// HELPER: auto-recalculate objective progress from KR scores
// ══════════════════════════════════════

async function recalcObjectiveProgress(objectiveId: string) {
  const krs = await db.query.keyResults.findMany({ where: eq(keyResults.objectiveId, objectiveId) });
  if (krs.length === 0) return;
  const avg = krs.reduce((sum, kr) => sum + kr.score, 0) / krs.length;
  await db.update(objectives).set({ progress: avg, updatedAt: new Date() }).where(eq(objectives.id, objectiveId));
}

// HELPER: create notification
async function notify(userId: string, type: string, title: string, message?: string) {
  await db.insert(notifications).values({
    id: `notif-${uid()}`, userId, type, title, message: message || null, read: false,
  });
}

// ══════════════════════════════════════
// MUTATIONS — Tasks
// ══════════════════════════════════════

export async function createTask(formData: FormData) {
  const currentUserId = await getCurrentUserId();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const keyResultId = formData.get("keyResultId") as string | null;
  const objectiveId = formData.get("objectiveId") as string | null;
  const parentTaskId = formData.get("parentTaskId") as string | null;
  const assigneeId = formData.get("assigneeId") as string | null;
  const assignedTeamId = formData.get("assignedTeamId") as string | null;
  const priority = (formData.get("priority") as string) || "medium";
  const dueDate = formData.get("dueDate") as string | null;

  await db.insert(tasks).values({
    id: `task-${uid()}`, title, description: description || null,
    keyResultId: keyResultId || null, objectiveId: objectiveId || null,
    parentTaskId: parentTaskId || null, assigneeId: assigneeId || null,
    createdById: currentUserId, assignedTeamId: assignedTeamId || null,
    priority, dueDate: dueDate || null, status: "todo",
  });

  // Notify assignee
  if (assigneeId && assigneeId !== currentUserId) {
    const creator = await db.query.users.findFirst({ where: eq(users.id, currentUserId) });
    await notify(assigneeId, "task_assigned", `Нова задача від ${creator?.name || ""}`, title);
  }

  revalidatePath("/");
}

export async function updateTaskStatus(taskId: string, status: string) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  await db.update(tasks).set({ status }).where(eq(tasks.id, taskId));

  // Notify creator if someone else changed status
  if (task && task.createdById !== task.assigneeId && task.createdById) {
    await notify(task.createdById, "task_status", `Задача "${task.title}" → ${status}`);
  }

  revalidatePath("/");
}

export async function updateTaskTitle(taskId: string, title: string) {
  await db.update(tasks).set({ title }).where(eq(tasks.id, taskId));
  revalidatePath("/");
}

export async function updateTaskPriority(taskId: string, priority: string) {
  await db.update(tasks).set({ priority }).where(eq(tasks.id, taskId));
  revalidatePath("/");
}

export async function updateTaskAssignee(taskId: string, assigneeId: string | null) {
  await db.update(tasks).set({ assigneeId }).where(eq(tasks.id, taskId));
  if (assigneeId) {
    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
    if (task) await notify(assigneeId, "task_assigned", "Вам призначено задачу", task.title);
  }
  revalidatePath("/");
}

export async function updateTaskDueDate(taskId: string, dueDate: string | null) {
  await db.update(tasks).set({ dueDate }).where(eq(tasks.id, taskId));
  revalidatePath("/");
}

export async function deleteTask(taskId: string) {
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath("/");
}

// ══════════════════════════════════════
// MUTATIONS — Key Results
// ══════════════════════════════════════

export async function createKeyResult(formData: FormData) {
  const title = formData.get("title") as string;
  const objectiveId = formData.get("objectiveId") as string;
  const targetValue = parseFloat(formData.get("targetValue") as string) || 100;
  const unit = (formData.get("unit") as string) || "%";

  await db.insert(keyResults).values({
    id: `kr-${uid()}`, title, objectiveId, targetValue, currentValue: 0, unit, score: 0, status: "on_track",
  });

  await recalcObjectiveProgress(objectiveId);
  revalidatePath("/");
}

export async function updateKRProgress(krId: string, currentValue: number) {
  const currentUserId = await getCurrentUserId();
  const kr = await db.query.keyResults.findFirst({ where: eq(keyResults.id, krId) });
  if (!kr) return;

  const score = Math.min(currentValue / kr.targetValue, 1);
  let status = "on_track";
  if (score >= 1) status = "done";
  else if (score < 0.3) status = "behind";
  else if (score < 0.6) status = "at_risk";

  await db.update(keyResults).set({ currentValue, score, status, updatedAt: new Date(), updatedById: currentUserId }).where(eq(keyResults.id, krId));
  await recalcObjectiveProgress(kr.objectiveId);
  revalidatePath("/");
}

export async function updateKRTitle(krId: string, title: string) {
  const currentUserId = await getCurrentUserId();
  await db.update(keyResults).set({ title, updatedAt: new Date(), updatedById: currentUserId }).where(eq(keyResults.id, krId));
  revalidatePath("/");
}

export async function updateKRUnit(krId: string, unit: string) {
  const currentUserId = await getCurrentUserId();
  await db.update(keyResults).set({ unit, updatedAt: new Date(), updatedById: currentUserId }).where(eq(keyResults.id, krId));
  revalidatePath("/");
}

export async function updateKRTarget(krId: string, targetValue: number) {
  const currentUserId = await getCurrentUserId();
  const kr = await db.query.keyResults.findFirst({ where: eq(keyResults.id, krId) });
  if (!kr) return;
  const score = Math.min(kr.currentValue / targetValue, 1);
  let status = "on_track";
  if (score >= 1) status = "done";
  else if (score < 0.3) status = "behind";
  else if (score < 0.6) status = "at_risk";
  await db.update(keyResults).set({ targetValue, score, status, updatedAt: new Date(), updatedById: currentUserId }).where(eq(keyResults.id, krId));
  await recalcObjectiveProgress(kr.objectiveId);
  revalidatePath("/");
}

export async function deleteKeyResult(krId: string) {
  const kr = await db.query.keyResults.findFirst({ where: eq(keyResults.id, krId) });
  await db.delete(tasks).where(eq(tasks.keyResultId, krId));
  await db.delete(keyResults).where(eq(keyResults.id, krId));
  if (kr) await recalcObjectiveProgress(kr.objectiveId);
  revalidatePath("/");
}

// ══════════════════════════════════════
// MUTATIONS — Objectives
// ══════════════════════════════════════

export async function createObjective(formData: FormData) {
  const currentUserId = await getCurrentUserId();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const parentObjectiveId = formData.get("parentObjectiveId") as string | null;
  const teamId = formData.get("teamId") as string | null;
  const quarter = (formData.get("quarter") as string) || "2026-Q1";
  const ownerId = (formData.get("ownerId") as string) || currentUserId;

  await db.insert(objectives).values({
    id: `obj-${uid()}`, title, description: description || null, ownerId,
    teamId: teamId || null, parentObjectiveId: parentObjectiveId || null,
    quarter, status: "active", progress: 0,
  });

  // Notify owner if cascading to someone else
  if (ownerId !== currentUserId) {
    const creator = await db.query.users.findFirst({ where: eq(users.id, currentUserId) });
    await notify(ownerId, "objective_cascade", `${creator?.name} каскадував вам ціль`, title);
  }

  revalidatePath("/");
}

export async function updateObjectiveTitle(objId: string, title: string) {
  await db.update(objectives).set({ title, updatedAt: new Date() }).where(eq(objectives.id, objId));
  revalidatePath("/");
}

export async function updateObjectiveDescription(objId: string, description: string) {
  await db.update(objectives).set({ description, updatedAt: new Date() }).where(eq(objectives.id, objId));
  revalidatePath("/");
}

export async function updateObjectiveStatus(objId: string, status: string) {
  await db.update(objectives).set({ status, updatedAt: new Date() }).where(eq(objectives.id, objId));
  revalidatePath("/");
}

export async function updateObjectiveOwner(objId: string, ownerId: string) {
  await db.update(objectives).set({ ownerId, updatedAt: new Date() }).where(eq(objectives.id, objId));
  const obj = await db.query.objectives.findFirst({ where: eq(objectives.id, objId) });
  if (obj) await notify(ownerId, "objective_cascade", "Вам передано ціль", obj.title);
  revalidatePath("/");
}

export async function updateObjectiveTeam(objId: string, teamId: string) {
  await db.update(objectives).set({ teamId, updatedAt: new Date() }).where(eq(objectives.id, objId));
  revalidatePath("/");
}

export async function updateObjectiveParent(objId: string, parentObjectiveId: string | null) {
  await db.update(objectives).set({ parentObjectiveId, updatedAt: new Date() }).where(eq(objectives.id, objId));
  revalidatePath("/");
}

export async function getAllObjectives() {
  return db.query.objectives.findMany({
    with: { owner: true, team: true },
    orderBy: (o, { desc }) => [desc(o.createdAt)],
  });
}

export async function deleteObjective(objId: string) {
  // Delete child objectives recursively
  const children = await db.query.objectives.findMany({ where: eq(objectives.parentObjectiveId, objId) });
  for (const child of children) { await deleteObjective(child.id); }
  await db.delete(comments).where(eq(comments.objectiveId, objId));
  await db.delete(tasks).where(eq(tasks.objectiveId, objId));
  await db.delete(keyResults).where(eq(keyResults.objectiveId, objId));
  await db.delete(objectives).where(eq(objectives.id, objId));
  revalidatePath("/");
}

// ══════════════════════════════════════
// MUTATIONS — Comments
// ══════════════════════════════════════

export async function addComment(text: string, objectiveId?: string, taskId?: string) {
  const currentUserId = await getCurrentUserId();
  await db.insert(comments).values({
    id: `cmt-${uid()}`, text, authorId: currentUserId,
    objectiveId: objectiveId || null, taskId: taskId || null,
  });

  // Notify objective/task owner
  if (objectiveId) {
    const obj = await db.query.objectives.findFirst({ where: eq(objectives.id, objectiveId) });
    if (obj && obj.ownerId !== currentUserId) {
      const author = await db.query.users.findFirst({ where: eq(users.id, currentUserId) });
      await notify(obj.ownerId, "comment", `${author?.name} прокоментував вашу ціль`, text);
    }
  }

  revalidatePath("/");
}

export async function updateComment(commentId: string, text: string) {
  await db.update(comments).set({ text }).where(eq(comments.id, commentId));
  revalidatePath("/");
}

export async function deleteComment(commentId: string) {
  await db.delete(comments).where(eq(comments.id, commentId));
  revalidatePath("/");
}

// ══════════════════════════════════════
// MUTATIONS — Notifications
// ══════════════════════════════════════

export async function markNotificationRead(notifId: string) {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notifId));
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const currentUserId = await getCurrentUserId();
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, currentUserId));
  revalidatePath("/");
}

// ══════════════════════════════════════
// MUTATIONS — Settings (users/teams)
// ══════════════════════════════════════

export async function updateUserProfile(userId: string, data: { name?: string; email?: string; role?: string; teamId?: string }) {
  const updates: any = {};
  if (data.name) updates.name = data.name;
  if (data.email) updates.email = data.email;
  if (data.role) updates.role = data.role;
  if (data.teamId) updates.teamId = data.teamId;
  await db.update(users).set(updates).where(eq(users.id, userId));
  revalidatePath("/");
}

export async function createTeam(name: string, color: string) {
  await db.insert(teams).values({ id: `team-${uid()}`, name, color });
  revalidatePath("/");
}

export async function updateTeam(teamId: string, name: string, color: string) {
  await db.update(teams).set({ name, color }).where(eq(teams.id, teamId));
  revalidatePath("/");
}

export async function deleteTeam(teamId: string) {
  await db.delete(teams).where(eq(teams.id, teamId));
  revalidatePath("/");
}
