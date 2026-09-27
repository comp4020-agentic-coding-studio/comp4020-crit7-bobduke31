import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
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

// Every ANU workflow here is real (enrolment, timetable self-allocation,
// assessments, results, SSAF, notices) — only the specific rows are invented,
// standing in for what ANUHub/Canvas/MyTimetable would otherwise supply.
// There's no auth, so there's exactly one student and this seed is what
// signs them "in": runs once, on an empty database, so a fresh volume looks
// like a lived-in account rather than a blank slate.
export function seedIfEmpty(db: BetterSQLite3Database) {
  const existing = db.select().from(students).all();
  if (existing.length > 0) return;

  const [student] = db
    .insert(students)
    .values({ uniId: "u1234567", name: "Alex Nguyen", email: "u1234567@anu.edu.au" })
    .returning()
    .all();

  const courseRows = db
    .insert(courses)
    .values([
      {
        code: "COMP4020",
        title: "Agentic Coding Studio",
        creditPoints: 6,
        teachingPeriod: "Semester 2 2026",
        description: "Weekly crits building full-stack prototypes with an AI coding agent.",
        feeAmount: 2650,
      },
      {
        code: "COMP3600",
        title: "Algorithms",
        creditPoints: 6,
        teachingPeriod: "Semester 2 2026",
        description: "Algorithm design and analysis, from greedy methods to NP-completeness.",
        feeAmount: 2650,
      },
      {
        code: "MATH2320",
        title: "Mathematical Foundations for Actuarial Studies",
        creditPoints: 6,
        teachingPeriod: "Semester 2 2026",
        description: "Probability and linear algebra foundations.",
        feeAmount: 2410,
      },
      {
        code: "COMP2100",
        title: "Software Design Methodologies",
        creditPoints: 6,
        teachingPeriod: "Semester 2 2026",
        description: "Object-oriented design, testing and refactoring at project scale.",
        feeAmount: 2650,
      },
      {
        code: "ENGN2000",
        title: "Professional Practice: Engineering and IT",
        creditPoints: 6,
        teachingPeriod: "Semester 2 2026",
        description: "Ethics, communication and professional practice for engineers.",
        feeAmount: 2410,
      },
      {
        code: "ARTH1002",
        title: "Introduction to Art History",
        creditPoints: 6,
        teachingPeriod: "Semester 2 2026",
        description: "Survey of art history from antiquity to the present.",
        feeAmount: 2100,
      },
    ])
    .returning()
    .all();

  const byCode = Object.fromEntries(courseRows.map((c) => [c.code, c]));
  const enrolledCodes = ["COMP4020", "COMP3600", "MATH2320"];

  db.insert(enrolments)
    .values(
      enrolledCodes.map((code) => ({
        studentId: student.id,
        courseId: byCode[code].id,
        status: "enrolled",
      })),
    )
    .run();

  db.insert(sessions)
    .values([
      {
        courseId: byCode.COMP4020.id,
        activityType: "Studio",
        dayOfWeek: "Tuesday",
        startTime: "10:00",
        endTime: "13:00",
        location: "Hanna Neumann 1.28",
      },
      {
        courseId: byCode.COMP3600.id,
        activityType: "Lecture",
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        location: "Manning Clark 3",
      },
      {
        courseId: byCode.COMP3600.id,
        activityType: "Tutorial",
        dayOfWeek: "Wednesday",
        startTime: "14:00",
        endTime: "15:00",
        location: "CSIT N101",
      },
      {
        courseId: byCode.MATH2320.id,
        activityType: "Lecture",
        dayOfWeek: "Thursday",
        startTime: "11:00",
        endTime: "12:00",
        location: "Peter Baume Theatre",
      },
      {
        courseId: byCode.COMP2100.id,
        activityType: "Lecture",
        dayOfWeek: "Monday",
        startTime: "13:00",
        endTime: "14:00",
        location: "CSIT N101",
      },
      {
        courseId: byCode.ENGN2000.id,
        activityType: "Workshop",
        dayOfWeek: "Friday",
        startTime: "10:00",
        endTime: "12:00",
        location: "Ian Ross 3",
      },
    ])
    .run();

  db.insert(assessments)
    .values([
      {
        courseId: byCode.COMP4020.id,
        title: "Crit 7 prototype",
        weightPercent: 10,
        dueDate: "2026-10-02",
      },
      {
        courseId: byCode.COMP4020.id,
        title: "Assignment 3: Final project",
        weightPercent: 40,
        dueDate: "2026-11-06",
      },
      {
        courseId: byCode.COMP3600.id,
        title: "Assignment 2",
        weightPercent: 20,
        dueDate: "2026-10-09",
      },
      {
        courseId: byCode.COMP3600.id,
        title: "Final exam",
        weightPercent: 50,
        dueDate: "2026-11-14",
      },
      {
        courseId: byCode.MATH2320.id,
        title: "Mid-semester test",
        weightPercent: 25,
        dueDate: "2026-09-30",
      },
      {
        courseId: byCode.COMP2100.id,
        title: "Design portfolio",
        weightPercent: 30,
        dueDate: "2026-10-16",
      },
    ])
    .run();

  db.insert(results)
    .values([
      {
        studentId: student.id,
        courseId: byCode.COMP2100.id,
        teachingPeriod: "Semester 1 2026",
        grade: "HD",
        mark: 87,
      },
      {
        studentId: student.id,
        courseId: byCode.ENGN2000.id,
        teachingPeriod: "Semester 1 2026",
        grade: "D",
        mark: 78,
      },
    ])
    .run();

  db.insert(feeItems)
    .values([
      {
        studentId: student.id,
        description: "Student Services and Amenities Fee (SSAF), Semester 2 2026",
        amount: 163,
        dueDate: "2026-08-15",
        status: "paid",
      },
      {
        studentId: student.id,
        description: "Overseas Student Health Cover top-up",
        amount: 210,
        dueDate: "2026-09-10",
        status: "unpaid",
      },
    ])
    .run();

  db.insert(notices)
    .values([
      {
        studentId: null,
        category: "General",
        title: "Semester 2 census date approaching",
        body: "The census date for Semester 2 2026 is 31 August. Enrolment changes after this date may attract fees.",
      },
      {
        studentId: null,
        category: "General",
        title: "Library extended hours during exam period",
        body: "Chifley and Hancock libraries will run 24/7 from week 12.",
      },
      {
        studentId: student.id,
        category: "Fees",
        title: "OSHC top-up payment due",
        body: "A payment of $210 is due 10 September 2026.",
      },
    ])
    .run();

  db.insert(tasks)
    .values([
      {
        studentId: student.id,
        type: "fees",
        title: "Pay outstanding OSHC top-up ($210)",
        href: "/fees",
        status: "open",
      },
      {
        studentId: student.id,
        type: "general",
        title: "Confirm your preferred name and pronouns are up to date",
        href: "/notices",
        status: "open",
      },
    ])
    .run();
}
