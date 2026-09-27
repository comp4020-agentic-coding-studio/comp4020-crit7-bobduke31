import { sql } from "drizzle-orm";
import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
//
// There's no auth in this prototype (out of scope for the crit): every query
// runs as the single seeded student in `seed.ts`. A real deployment would add
// a session/identity layer above this schema, not change its shape.

export const students = sqliteTable("students", {
  id: int().primaryKey({ autoIncrement: true }),
  uniId: text("uni_id").notNull().unique(),
  name: text().notNull(),
  email: text().notNull(),
});

export const courses = sqliteTable("courses", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(),
  title: text().notNull(),
  creditPoints: int("credit_points").notNull().default(6),
  teachingPeriod: text("teaching_period").notNull(),
  description: text().notNull(),
  feeAmount: real("fee_amount").notNull(),
});

// A course's timetabled activities. Only enrolled courses' sessions show up
// on the timetable — that join is what makes the timetable a *view* of
// enrolment state rather than a second place the same fact is stored.
export const sessions = sqliteTable("sessions", {
  id: int().primaryKey({ autoIncrement: true }),
  courseId: int("course_id")
    .notNull()
    .references(() => courses.id),
  activityType: text("activity_type").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text().notNull(),
});

// The spine: enrolling in or dropping a course is the one write that ripples
// through Today, Timetable, Assessments and Fees, because each of those
// reads through this table rather than keeping its own copy of "what am I
// taking."
export const enrolments = sqliteTable("enrolments", {
  id: int().primaryKey({ autoIncrement: true }),
  studentId: int("student_id")
    .notNull()
    .references(() => students.id),
  courseId: int("course_id")
    .notNull()
    .references(() => courses.id),
  status: text().notNull(), // "enrolled" | "dropped"
  enrolledAt: text("enrolled_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  droppedAt: text("dropped_at"),
});

export const assessments = sqliteTable("assessments", {
  id: int().primaryKey({ autoIncrement: true }),
  courseId: int("course_id")
    .notNull()
    .references(() => courses.id),
  title: text().notNull(),
  weightPercent: int("weight_percent").notNull(),
  dueDate: text("due_date").notNull(),
});

// Past-teaching-period outcomes — seeded, not derived: results aren't a
// consequence of this semester's enrolment, they're history.
export const results = sqliteTable("results", {
  id: int().primaryKey({ autoIncrement: true }),
  studentId: int("student_id")
    .notNull()
    .references(() => students.id),
  courseId: int("course_id")
    .notNull()
    .references(() => courses.id),
  teachingPeriod: text("teaching_period").notNull(),
  grade: text().notNull(),
  mark: int().notNull(),
});

// Historical/non-course charges (e.g. SSAF). Current-semester tuition is
// derived from `enrolments` + `courses.feeAmount` at read time, not stored
// here — that's what keeps dropping a course update the fee balance for free.
export const feeItems = sqliteTable("fee_items", {
  id: int().primaryKey({ autoIncrement: true }),
  studentId: int("student_id")
    .notNull()
    .references(() => students.id),
  description: text().notNull(),
  amount: real().notNull(),
  dueDate: text("due_date").notNull(),
  status: text().notNull(), // "paid" | "unpaid"
});

// studentId is nullable: a broadcast notice (null) vs one generated for a
// specific student's action (e.g. an enrolment change).
export const notices = sqliteTable("notices", {
  id: int().primaryKey({ autoIncrement: true }),
  studentId: int("student_id").references(() => students.id),
  category: text().notNull(),
  title: text().notNull(),
  body: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// The unified action queue — the second genuinely persistent write, and the
// most direct answer to "one place instead of three" for the things a
// student actually has to go and do something about.
export const tasks = sqliteTable("tasks", {
  id: int().primaryKey({ autoIncrement: true }),
  studentId: int("student_id")
    .notNull()
    .references(() => students.id),
  type: text().notNull(),
  title: text().notNull(),
  href: text(),
  status: text().notNull().default("open"), // "open" | "done"
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Student = typeof students.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Enrolment = typeof enrolments.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Result = typeof results.$inferSelect;
export type FeeItem = typeof feeItems.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type Task = typeof tasks.$inferSelect;
