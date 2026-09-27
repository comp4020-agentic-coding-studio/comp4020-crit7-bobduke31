import type { APIRoute } from "astro";
import { completeTask, getCurrentStudent } from "../../lib/db";

function safeRedirect(path: FormDataEntryValue | null): string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    ? path
    : "/";
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const taskId = Number(form.get("task_id"));
  const to = safeRedirect(form.get("redirect_to"));

  if (Number.isInteger(taskId)) {
    const student = getCurrentStudent();
    completeTask(student.id, taskId);
  }

  return redirect(to, 303);
};
