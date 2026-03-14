import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "okr.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  sqlite.exec("DELETE FROM tasks");
  sqlite.exec("DELETE FROM key_results");
  sqlite.exec("DELETE FROM objectives");
  sqlite.exec("DELETE FROM users");
  sqlite.exec("DELETE FROM teams");

  // ── Teams ──
  db.insert(schema.teams).values([
    { id: "team-exec", name: "Виконавча команда", color: "#8b5cf6" },
    { id: "team-product", name: "Продукт", color: "#3b82f6" },
    { id: "team-eng", name: "Інженерія", color: "#10b981" },
    { id: "team-marketing", name: "Маркетинг", color: "#f59e0b" },
    { id: "team-sales", name: "Продажі", color: "#ef4444" },
    { id: "team-design", name: "Дизайн", color: "#ec4899" },
  ]).run();

  // ── Users (hierarchy: CEO → Directors → Managers → Members) ──
  db.insert(schema.users).values([
    // CEO
    {
      id: "u-ceo",
      name: "Олександр Коваленко",
      email: "ceo@company.ua",
      role: "ceo",
      teamId: "team-exec",
      managerId: null,
      avatarUrl: null,
    },
    // Directors
    {
      id: "u-dir-product",
      name: "Марія Шевченко",
      email: "maria@company.ua",
      role: "director",
      teamId: "team-product",
      managerId: "u-ceo",
      avatarUrl: null,
    },
    {
      id: "u-dir-eng",
      name: "Андрій Бондаренко",
      email: "andrii@company.ua",
      role: "director",
      teamId: "team-eng",
      managerId: "u-ceo",
      avatarUrl: null,
    },
    {
      id: "u-dir-marketing",
      name: "Ольга Мельник",
      email: "olga@company.ua",
      role: "director",
      teamId: "team-marketing",
      managerId: "u-ceo",
      avatarUrl: null,
    },
    // Managers
    {
      id: "u-mgr-frontend",
      name: "Дмитро Ткаченко",
      email: "dmytro@company.ua",
      role: "manager",
      teamId: "team-eng",
      managerId: "u-dir-eng",
      avatarUrl: null,
    },
    {
      id: "u-mgr-backend",
      name: "Ірина Кравченко",
      email: "iryna@company.ua",
      role: "manager",
      teamId: "team-eng",
      managerId: "u-dir-eng",
      avatarUrl: null,
    },
    {
      id: "u-mgr-sales",
      name: "Василь Петренко",
      email: "vasyl@company.ua",
      role: "manager",
      teamId: "team-sales",
      managerId: "u-ceo",
      avatarUrl: null,
    },
    // Team Leads & Members
    {
      id: "u-lead-ui",
      name: "Наталія Іванова",
      email: "natalia@company.ua",
      role: "lead",
      teamId: "team-design",
      managerId: "u-dir-product",
      avatarUrl: null,
    },
    {
      id: "u-dev-1",
      name: "Олег Сидоренко",
      email: "oleg@company.ua",
      role: "member",
      teamId: "team-eng",
      managerId: "u-mgr-frontend",
      avatarUrl: null,
    },
    {
      id: "u-dev-2",
      name: "Катерина Лисенко",
      email: "kateryna@company.ua",
      role: "member",
      teamId: "team-eng",
      managerId: "u-mgr-backend",
      avatarUrl: null,
    },
    {
      id: "u-marketer-1",
      name: "Тарас Гончаренко",
      email: "taras@company.ua",
      role: "member",
      teamId: "team-marketing",
      managerId: "u-dir-marketing",
      avatarUrl: null,
    },
    {
      id: "u-sales-1",
      name: "Юлія Романенко",
      email: "yulia@company.ua",
      role: "member",
      teamId: "team-sales",
      managerId: "u-mgr-sales",
      avatarUrl: null,
    },
  ]).run();

  // ── Objectives (cascading OKR tree like the football team example) ──

  // Level 0: CEO objective
  db.insert(schema.objectives).values([
    {
      id: "obj-company",
      title: "Збільшити дохід компанії вдесятеро за рік",
      description: "Головна ціль компанії на 2026 рік — досягти 10x зростання доходу через нові продукти, розширення ринку та операційну ефективність.",
      ownerId: "u-ceo",
      teamId: "team-exec",
      parentObjectiveId: null,
      quarter: "2026-Q1",
      status: "active",
      progress: 0.35,
    },
  ]).run();

  // Level 1: Director objectives (cascaded from CEO)
  db.insert(schema.objectives).values([
    {
      id: "obj-product-launch",
      title: "Запустити MVP нового продукту до кінця кварталу",
      description: "Розробити та запустити мінімально життєздатний продукт, що вирішує потребу ринку.",
      ownerId: "u-dir-product",
      teamId: "team-product",
      parentObjectiveId: "obj-company",
      quarter: "2026-Q1",
      status: "active",
      progress: 0.45,
    },
    {
      id: "obj-eng-perf",
      title: "Забезпечити технічну досконалість платформи",
      description: "Покращити продуктивність, надійність та масштабованість платформи.",
      ownerId: "u-dir-eng",
      teamId: "team-eng",
      parentObjectiveId: "obj-company",
      quarter: "2026-Q1",
      status: "active",
      progress: 0.30,
    },
    {
      id: "obj-marketing-growth",
      title: "Збільшити впізнаваність бренду на 200%",
      description: "Маркетингова стратегія для агресивного зростання аудиторії та впізнаваності.",
      ownerId: "u-dir-marketing",
      teamId: "team-marketing",
      parentObjectiveId: "obj-company",
      quarter: "2026-Q1",
      status: "active",
      progress: 0.25,
    },
    {
      id: "obj-sales-revenue",
      title: "Досягти $500K MRR до кінця Q1",
      description: "Збільшити щомісячний регулярний дохід через нових та існуючих клієнтів.",
      ownerId: "u-mgr-sales",
      teamId: "team-sales",
      parentObjectiveId: "obj-company",
      quarter: "2026-Q1",
      status: "active",
      progress: 0.40,
    },
  ]).run();

  // Level 2: Manager objectives (cascaded from directors)
  db.insert(schema.objectives).values([
    {
      id: "obj-frontend-ux",
      title: "Створити бездоганний UX для нового продукту",
      description: "Фронтенд-частина MVP з високою якістю інтерфейсу.",
      ownerId: "u-mgr-frontend",
      teamId: "team-eng",
      parentObjectiveId: "obj-product-launch",
      quarter: "2026-Q1",
      status: "active",
      progress: 0.50,
    },
    {
      id: "obj-backend-api",
      title: "Розробити масштабований API для MVP",
      description: "Бекенд інфраструктура та API endpoints для нового продукту.",
      ownerId: "u-mgr-backend",
      teamId: "team-eng",
      parentObjectiveId: "obj-product-launch",
      quarter: "2026-Q1",
      status: "active",
      progress: 0.35,
    },
    {
      id: "obj-design-system",
      title: "Впровадити дизайн-систему компанії",
      description: "Уніфікована дизайн-система для всіх продуктів.",
      ownerId: "u-lead-ui",
      teamId: "team-design",
      parentObjectiveId: "obj-product-launch",
      quarter: "2026-Q1",
      status: "active",
      progress: 0.60,
    },
  ]).run();

  // ── Key Results ──
  db.insert(schema.keyResults).values([
    // CEO KRs
    {
      id: "kr-revenue-10x",
      title: "Досягти $1M ARR",
      objectiveId: "obj-company",
      targetValue: 1000000,
      currentValue: 350000,
      unit: "$",
      score: 0.35,
      status: "on_track",
    },
    {
      id: "kr-customers",
      title: "Залучити 500 платних клієнтів",
      objectiveId: "obj-company",
      targetValue: 500,
      currentValue: 180,
      unit: "клієнтів",
      score: 0.36,
      status: "on_track",
    },
    {
      id: "kr-nps",
      title: "NPS > 50",
      objectiveId: "obj-company",
      targetValue: 50,
      currentValue: 42,
      unit: "NPS",
      score: 0.84,
      status: "on_track",
    },
    // Product Director KRs
    {
      id: "kr-mvp-launch",
      title: "MVP запущено і доступне для перших 100 користувачів",
      objectiveId: "obj-product-launch",
      targetValue: 100,
      currentValue: 45,
      unit: "користувачів",
      score: 0.45,
      status: "at_risk",
    },
    {
      id: "kr-user-retention",
      title: "Retention Day-7 ≥ 40%",
      objectiveId: "obj-product-launch",
      targetValue: 40,
      currentValue: 28,
      unit: "%",
      score: 0.70,
      status: "on_track",
    },
    // Engineering Director KRs
    {
      id: "kr-uptime",
      title: "Uptime ≥ 99.9%",
      objectiveId: "obj-eng-perf",
      targetValue: 99.9,
      currentValue: 99.5,
      unit: "%",
      score: 0.60,
      status: "at_risk",
    },
    {
      id: "kr-page-load",
      title: "Час завантаження сторінки < 1.5с",
      objectiveId: "obj-eng-perf",
      targetValue: 1.5,
      currentValue: 2.1,
      unit: "с",
      score: 0.40,
      status: "behind",
    },
    {
      id: "kr-test-coverage",
      title: "Покриття тестами ≥ 80%",
      objectiveId: "obj-eng-perf",
      targetValue: 80,
      currentValue: 65,
      unit: "%",
      score: 0.81,
      status: "on_track",
    },
    // Marketing KRs
    {
      id: "kr-traffic",
      title: "Органічний трафік 50K відвідувачів/міс",
      objectiveId: "obj-marketing-growth",
      targetValue: 50000,
      currentValue: 12000,
      unit: "відвідувачів",
      score: 0.24,
      status: "behind",
    },
    {
      id: "kr-social-followers",
      title: "10K підписників у соціальних мережах",
      objectiveId: "obj-marketing-growth",
      targetValue: 10000,
      currentValue: 3200,
      unit: "підписників",
      score: 0.32,
      status: "at_risk",
    },
    // Sales KRs
    {
      id: "kr-mrr",
      title: "MRR $500K",
      objectiveId: "obj-sales-revenue",
      targetValue: 500000,
      currentValue: 200000,
      unit: "$",
      score: 0.40,
      status: "on_track",
    },
    {
      id: "kr-deals-closed",
      title: "Закрити 30 enterprise угод",
      objectiveId: "obj-sales-revenue",
      targetValue: 30,
      currentValue: 12,
      unit: "угод",
      score: 0.40,
      status: "on_track",
    },
    // Frontend Manager KRs
    {
      id: "kr-ui-screens",
      title: "Реалізувати 15 ключових екранів UI",
      objectiveId: "obj-frontend-ux",
      targetValue: 15,
      currentValue: 8,
      unit: "екранів",
      score: 0.53,
      status: "on_track",
    },
    {
      id: "kr-lighthouse",
      title: "Lighthouse Performance Score ≥ 90",
      objectiveId: "obj-frontend-ux",
      targetValue: 90,
      currentValue: 72,
      unit: "балів",
      score: 0.80,
      status: "on_track",
    },
    // Backend Manager KRs
    {
      id: "kr-api-endpoints",
      title: "Розробити 25 API endpoints",
      objectiveId: "obj-backend-api",
      targetValue: 25,
      currentValue: 9,
      unit: "endpoints",
      score: 0.36,
      status: "at_risk",
    },
    {
      id: "kr-api-latency",
      title: "API latency p95 < 200ms",
      objectiveId: "obj-backend-api",
      targetValue: 200,
      currentValue: 340,
      unit: "ms",
      score: 0.30,
      status: "behind",
    },
    // Design Lead KRs
    {
      id: "kr-components",
      title: "Створити 40 компонентів дизайн-системи",
      objectiveId: "obj-design-system",
      targetValue: 40,
      currentValue: 28,
      unit: "компонентів",
      score: 0.70,
      status: "on_track",
    },
    {
      id: "kr-figma-coverage",
      title: "100% покриття у Figma для MVP",
      objectiveId: "obj-design-system",
      targetValue: 100,
      currentValue: 75,
      unit: "%",
      score: 0.75,
      status: "on_track",
    },
  ]).run();

  // ── Tasks ──
  db.insert(schema.tasks).values([
    // Tasks under frontend KRs
    {
      id: "task-1",
      title: "Розробити Dashboard компонент",
      description: "Головна сторінка з OKR деревом та прогресом",
      keyResultId: "kr-ui-screens",
      objectiveId: "obj-frontend-ux",
      assigneeId: "u-dev-1",
      createdById: "u-mgr-frontend",
      status: "in_progress",
      priority: "high",
      dueDate: "2026-03-20",
    },
    {
      id: "task-2",
      title: "Компонент навігації та бічна панель",
      keyResultId: "kr-ui-screens",
      objectiveId: "obj-frontend-ux",
      assigneeId: "u-dev-1",
      createdById: "u-mgr-frontend",
      status: "done",
      priority: "high",
      dueDate: "2026-03-10",
    },
    {
      id: "task-3",
      title: "Оптимізувати рендеринг списків (virtualization)",
      keyResultId: "kr-lighthouse",
      objectiveId: "obj-frontend-ux",
      assigneeId: "u-dev-1",
      createdById: "u-mgr-frontend",
      status: "todo",
      priority: "medium",
      dueDate: "2026-03-25",
    },
    // Tasks under backend KRs
    {
      id: "task-4",
      title: "Спроектувати REST API для OKR модуля",
      keyResultId: "kr-api-endpoints",
      objectiveId: "obj-backend-api",
      assigneeId: "u-dev-2",
      createdById: "u-mgr-backend",
      status: "in_progress",
      priority: "critical",
      dueDate: "2026-03-18",
    },
    {
      id: "task-5",
      title: "Налаштувати кешування Redis для API",
      keyResultId: "kr-api-latency",
      objectiveId: "obj-backend-api",
      assigneeId: "u-dev-2",
      createdById: "u-mgr-backend",
      status: "todo",
      priority: "high",
      dueDate: "2026-03-22",
    },
    // Cross-team task: marketing needs help from engineering
    {
      id: "task-6",
      title: "Інтегрувати analytics tracking на сайт",
      description: "Маркетинг потребує tracking events для SEO аналітики — потрібна допомога інженерів",
      keyResultId: "kr-traffic",
      objectiveId: "obj-marketing-growth",
      assigneeId: "u-dev-1",
      createdById: "u-dir-marketing",
      assignedTeamId: "team-eng",
      status: "todo",
      priority: "medium",
      dueDate: "2026-03-28",
    },
    // Sub-tasks (delegated down)
    {
      id: "task-7",
      title: "Верстка карток OKR для dashboard",
      parentTaskId: "task-1",
      keyResultId: "kr-ui-screens",
      objectiveId: "obj-frontend-ux",
      assigneeId: "u-dev-1",
      createdById: "u-mgr-frontend",
      status: "in_progress",
      priority: "high",
      dueDate: "2026-03-17",
    },
    {
      id: "task-8",
      title: "API інтеграція для dashboard даних",
      parentTaskId: "task-1",
      keyResultId: "kr-ui-screens",
      objectiveId: "obj-frontend-ux",
      assigneeId: "u-dev-1",
      createdById: "u-mgr-frontend",
      status: "todo",
      priority: "high",
      dueDate: "2026-03-19",
    },
    // Marketing tasks
    {
      id: "task-9",
      title: "Запустити рекламну кампанію в Google Ads",
      keyResultId: "kr-traffic",
      objectiveId: "obj-marketing-growth",
      assigneeId: "u-marketer-1",
      createdById: "u-dir-marketing",
      status: "in_progress",
      priority: "high",
      dueDate: "2026-03-15",
    },
    {
      id: "task-10",
      title: "Створити контент-план на місяць",
      keyResultId: "kr-social-followers",
      objectiveId: "obj-marketing-growth",
      assigneeId: "u-marketer-1",
      createdById: "u-dir-marketing",
      status: "done",
      priority: "medium",
      dueDate: "2026-03-05",
    },
    // Sales tasks
    {
      id: "task-11",
      title: "Провести 15 демо-дзвінків з Enterprise клієнтами",
      keyResultId: "kr-deals-closed",
      objectiveId: "obj-sales-revenue",
      assigneeId: "u-sales-1",
      createdById: "u-mgr-sales",
      status: "in_progress",
      priority: "critical",
      dueDate: "2026-03-20",
    },
    {
      id: "task-12",
      title: "Підготувати sales deck для нового продукту",
      description: "Потрібна координація з продуктовою та дизайн командами",
      keyResultId: "kr-deals-closed",
      objectiveId: "obj-sales-revenue",
      assigneeId: "u-sales-1",
      createdById: "u-mgr-sales",
      assignedTeamId: "team-sales",
      status: "todo",
      priority: "high",
      dueDate: "2026-03-18",
    },
    // Design tasks
    {
      id: "task-13",
      title: "Фінальний дизайн компонентів для дизайн-системи",
      keyResultId: "kr-components",
      objectiveId: "obj-design-system",
      assigneeId: "u-lead-ui",
      createdById: "u-dir-product",
      status: "in_progress",
      priority: "high",
      dueDate: "2026-03-22",
    },
    {
      id: "task-14",
      title: "Ревю дизайн-системи з фронтенд командою",
      description: "Крос-командна зустріч для синхронізації дизайну та реалізації",
      keyResultId: "kr-components",
      objectiveId: "obj-design-system",
      assigneeId: "u-lead-ui",
      createdById: "u-lead-ui",
      assignedTeamId: "team-eng",
      status: "todo",
      priority: "medium",
      dueDate: "2026-03-25",
    },
  ]).run();

  console.log("✅ Seeded successfully!");
  console.log("   - 6 teams");
  console.log("   - 12 users");
  console.log("   - 8 objectives (3-level cascade)");
  console.log("   - 18 key results");
  console.log("   - 14 tasks (with subtasks & cross-team)");
}

seed();
