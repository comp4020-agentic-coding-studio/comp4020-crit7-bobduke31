import { beforeAll, describe, expect, inject, it } from "vitest";

// The crit's real promise: enrolling in (or dropping) a course is the one
// write in the app, and every other area — Courses, Timetable, Assessments,
// Fees, Notices — reads through it rather than keeping its own copy. These
// tests drive that one action over HTTP and check its effects land
// everywhere they should, and survive a fresh page load (not just the
// redirect response) — the same "persists across reload" contract the
// starter's guestbook test proved, applied to the portal's spine.
const baseUrl = inject("baseUrl");

// Astro checks form POSTs carry a same-origin Origin header (CSRF
// protection); browsers send it automatically, a bare fetch doesn't.
const post = (path: string, body: URLSearchParams) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body,
    redirect: "manual",
  });

const get = async (path: string) => (await fetch(new URL(path, baseUrl))).text();

describe("enrolment is the portal's spine", () => {
  const code = "COMP2100";

  beforeAll(async () => {
    // COMP2100 is seeded as available, not enrolled — start from a known state
    expect(await get("/courses")).toContain(code);
  });

  it("starts unenrolled: absent from timetable, assessments and fees", async () => {
    expect(await get("/timetable")).not.toContain(code);
    expect(await get("/assessments")).not.toContain(code);
  });

  it("enrolling redirects back to the referring page", async () => {
    const res = await post(
      "/api/enrolments",
      new URLSearchParams({ course_code: code, action: "enrol", redirect_to: "/courses" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/courses");
  });

  it("propagates to every area that reads through enrolments, after a fresh reload", async () => {
    expect(await get("/courses")).toContain("Drop");
    expect(await get("/timetable")).toContain(code);
    expect(await get("/assessments")).toContain(code);
    expect(await get("/notices")).toContain(`Enrolled in ${code}`);
  });

  it("increases the tuition estimate on Fees", async () => {
    // seeded enrolments (2,650 + 2,650 + 2,410) plus COMP2100's 2,650
    const fees = await get("/fees");
    expect(fees).toContain("10,360.00");
  });

  it("dropping removes it from every area again", async () => {
    const res = await post(
      "/api/enrolments",
      new URLSearchParams({ course_code: code, action: "drop", redirect_to: "/courses" }),
    );
    expect(res.status).toBe(303);

    expect(await get("/timetable")).not.toContain(code);
    expect(await get("/assessments")).not.toContain(code);
    expect(await get("/notices")).toContain(`Dropped ${code}`);
  });
});

describe("the task queue persists across reload", () => {
  it("shows the seeded fees task as outstanding", async () => {
    expect(await get("/")).toContain("Pay outstanding OSHC top-up");
  });

  it("completing it removes it from Today and stays gone on a fresh load", async () => {
    // task 1 is the first row the seed inserts (see src/lib/seed.ts)
    const res = await post(
      "/api/tasks",
      new URLSearchParams({ task_id: "1", redirect_to: "/" }),
    );
    expect(res.status).toBe(303);

    expect(await get("/")).not.toContain("Pay outstanding OSHC top-up");
  });
});
