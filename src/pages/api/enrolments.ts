import type { APIRoute } from "astro";
import { dropCourse, enrolInCourse, getCourseByCode, getCurrentStudent } from "../../lib/db";

// A same-origin path to redirect back to (validated below), carried as a
// hidden form field rather than parsed from the Origin/Referer header. Every
// page that can enrol or drop sets this to itself, so a form submission
// returns you where you started (Today or Courses) with the state re-read
// from the database — the same POST + redirect pattern as the starter's
// guestbook, applied to the enrolment spine instead.
function safeRedirect(path: FormDataEntryValue | null): string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    ? path
    : "/courses";
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const code = String(form.get("course_code") ?? "");
  const action = String(form.get("action") ?? "");
  const to = safeRedirect(form.get("redirect_to"));

  const course = getCourseByCode(code);
  if (course) {
    const student = getCurrentStudent();
    if (action === "drop") {
      dropCourse(student.id, course.id);
    } else {
      enrolInCourse(student.id, course.id);
    }
  }

  return redirect(to, 303);
};
