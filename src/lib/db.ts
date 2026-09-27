import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { bus } from "./events";
import { seedIfEmpty } from "./seed";
import {
  assessments,
  courses,
  enrolments,
  feeItems,
  notices,
  results,
  sessions,
  students,
  tasks,
} from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });
seedIfEmpty(db);

// No auth in this prototype — every request acts as this one seeded student.
export function getCurrentStudent() {
  return db.select().from(students).limit(1).get()!;
}

export function listCourses() {
  return db.select().from(courses).orderBy(asc(courses.code)).all();
}

export function getCourseByCode(code: string) {
  return db.select().from(courses).where(eq(courses.code, code)).get();
}

export function listEnrolments(studentId: number) {
  return db
    .select({ enrolment: enrolments, course: courses })
    .from(enrolments)
    .innerJoin(courses, eq(enrolments.courseId, courses.id))
    .where(and(eq(enrolments.studentId, studentId), eq(enrolments.status, "enrolled")))
    .orderBy(asc(courses.code))
    .all();
}

function currentEnrolment(studentId: number, courseId: number) {
  return db
    .select()
    .from(enrolments)
    .where(and(eq(enrolments.studentId, studentId), eq(enrolments.courseId, courseId)))
    .get();
}

// The spine: this and `dropCourse` are the only writes in the app, and every
// other page's "integration" is just a read that joins through `enrolments`.
export function enrolInCourse(studentId: number, courseId: number) {
  const course = db.select().from(courses).where(eq(courses.id, courseId)).get();
  if (!course) return;

  const existing = currentEnrolment(studentId, courseId);
  if (existing?.status === "enrolled") return;

  if (existing) {
    db.update(enrolments)
      .set({ status: "enrolled", enrolledAt: sql`(datetime('now'))`, droppedAt: null })
      .where(eq(enrolments.id, existing.id))
      .run();
  } else {
    db.insert(enrolments).values({ studentId, courseId, status: "enrolled" }).run();
  }

  db.insert(notices)
    .values({
      studentId,
      category: "Enrolment",
      title: `Enrolled in ${course.code}`,
      body: `You are now enrolled in ${course.code} ${course.title} for ${course.teachingPeriod}. It has been added to your timetable, assessments and fee estimate.`,
    })
    .run();

  bus.emit("change");
}

export function dropCourse(studentId: number, courseId: number) {
  const course = db.select().from(courses).where(eq(courses.id, courseId)).get();
  const existing = currentEnrolment(studentId, courseId);
  if (!course || !existing || existing.status !== "enrolled") return;

  db.update(enrolments)
    .set({ status: "dropped", droppedAt: sql`(datetime('now'))` })
    .where(eq(enrolments.id, existing.id))
    .run();

  db.insert(notices)
    .values({
      studentId,
      category: "Enrolment",
      title: `Dropped ${course.code}`,
      body: `You have dropped ${course.code} ${course.title}. It has been removed from your timetable, assessments and fee estimate.`,
    })
    .run();

  bus.emit("change");
}

export function listSessionsForEnrolled(studentId: number) {
  return db
    .select({ session: sessions, course: courses })
    .from(sessions)
    .innerJoin(courses, eq(sessions.courseId, courses.id))
    .innerJoin(
      enrolments,
      and(
        eq(enrolments.courseId, courses.id),
        eq(enrolments.studentId, studentId),
        eq(enrolments.status, "enrolled"),
      ),
    )
    .all();
}

export function listAssessmentsForEnrolled(studentId: number) {
  return db
    .select({ assessment: assessments, course: courses })
    .from(assessments)
    .innerJoin(courses, eq(assessments.courseId, courses.id))
    .innerJoin(
      enrolments,
      and(
        eq(enrolments.courseId, courses.id),
        eq(enrolments.studentId, studentId),
        eq(enrolments.status, "enrolled"),
      ),
    )
    .orderBy(asc(assessments.dueDate))
    .all();
}

export function listResults(studentId: number) {
  return db
    .select({ result: results, course: courses })
    .from(results)
    .innerJoin(courses, eq(results.courseId, courses.id))
    .where(eq(results.studentId, studentId))
    .orderBy(desc(results.teachingPeriod))
    .all();
}

// Current-semester tuition is derived from live enrolments, not stored —
// dropping a course changes this total with no separate write.
export function currentTuitionEstimate(studentId: number) {
  const enrolled = listEnrolments(studentId);
  return enrolled.reduce((total, { course }) => total + course.feeAmount, 0);
}

export function listFeeItems(studentId: number) {
  return db
    .select()
    .from(feeItems)
    .where(eq(feeItems.studentId, studentId))
    .orderBy(desc(feeItems.dueDate))
    .all();
}

export function listNotices(studentId: number, limit = 50) {
  return db
    .select()
    .from(notices)
    .where(or(eq(notices.studentId, studentId), isNull(notices.studentId)))
    .orderBy(desc(notices.id))
    .limit(limit)
    .all();
}

export function listTasks(studentId: number) {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.studentId, studentId))
    .orderBy(asc(tasks.status), desc(tasks.id))
    .all();
}

export function completeTask(studentId: number, taskId: number) {
  const task = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.studentId, studentId)))
    .get();
  if (!task) return;
  db.update(tasks).set({ status: "done" }).where(eq(tasks.id, taskId)).run();
  bus.emit("change");
}

export function reopenTask(studentId: number, taskId: number) {
  const task = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.studentId, studentId)))
    .get();
  if (!task) return;
  db.update(tasks).set({ status: "open" }).where(eq(tasks.id, taskId)).run();
  bus.emit("change");
}
