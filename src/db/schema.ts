import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ── Teams ──
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ── Users ──
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("member"),
  avatarUrl: text("avatar_url"),
  teamId: text("team_id").references(() => teams.id),
  managerId: text("manager_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ── Objectives ──
export const objectives = sqliteTable("objectives", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull().references(() => users.id),
  teamId: text("team_id").references(() => teams.id),
  parentObjectiveId: text("parent_objective_id"),
  quarter: text("quarter").notNull(),
  status: text("status").notNull().default("active"),
  progress: real("progress").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ── Key Results ──
export const keyResults = sqliteTable("key_results", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  objectiveId: text("objective_id").notNull().references(() => objectives.id),
  targetValue: real("target_value").notNull().default(100),
  currentValue: real("current_value").notNull().default(0),
  unit: text("unit").notNull().default("%"),
  score: real("score").notNull().default(0),
  status: text("status").notNull().default("on_track"),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  updatedById: text("updated_by_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ── Tasks ──
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  keyResultId: text("key_result_id").references(() => keyResults.id),
  objectiveId: text("objective_id").references(() => objectives.id),
  parentTaskId: text("parent_task_id"),
  assigneeId: text("assignee_id").references(() => users.id),
  createdById: text("created_by_id").notNull().references(() => users.id),
  assignedTeamId: text("assigned_team_id").references(() => teams.id),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  dueDate: text("due_date"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ── Comments ──
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  authorId: text("author_id").notNull().references(() => users.id),
  objectiveId: text("objective_id").references(() => objectives.id),
  taskId: text("task_id").references(() => tasks.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ── Notifications ──
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // task_assigned | task_status | kr_updated | comment | objective_cascade
  title: text("title").notNull(),
  message: text("message"),
  linkUrl: text("link_url"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ── Relations ──
export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(users),
  objectives: many(objectives),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, { fields: [users.teamId], references: [teams.id] }),
  manager: one(users, { fields: [users.managerId], references: [users.id], relationName: "manager" }),
  directReports: many(users, { relationName: "manager" }),
  objectives: many(objectives),
  assignedTasks: many(tasks),
  notifications: many(notifications),
}));

export const objectivesRelations = relations(objectives, ({ one, many }) => ({
  owner: one(users, { fields: [objectives.ownerId], references: [users.id] }),
  team: one(teams, { fields: [objectives.teamId], references: [teams.id] }),
  parentObjective: one(objectives, { fields: [objectives.parentObjectiveId], references: [objectives.id], relationName: "parentChild" }),
  childObjectives: many(objectives, { relationName: "parentChild" }),
  keyResults: many(keyResults),
  tasks: many(tasks),
  comments: many(comments),
}));

export const keyResultsRelations = relations(keyResults, ({ one, many }) => ({
  objective: one(objectives, { fields: [keyResults.objectiveId], references: [objectives.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  keyResult: one(keyResults, { fields: [tasks.keyResultId], references: [keyResults.id] }),
  objective: one(objectives, { fields: [tasks.objectiveId], references: [objectives.id] }),
  parentTask: one(tasks, { fields: [tasks.parentTaskId], references: [tasks.id], relationName: "subtasks" }),
  subtasks: many(tasks, { relationName: "subtasks" }),
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
  createdBy: one(users, { fields: [tasks.createdById], references: [users.id] }),
  assignedTeam: one(teams, { fields: [tasks.assignedTeamId], references: [teams.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  objective: one(objectives, { fields: [comments.objectiveId], references: [objectives.id] }),
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Objective = typeof objectives.$inferSelect;
export type KeyResult = typeof keyResults.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
