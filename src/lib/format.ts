const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function sortByDayAndTime<T extends { dayOfWeek: string; startTime: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const day = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
    return day !== 0 ? day : a.startTime.localeCompare(b.startTime);
  });
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

// Whole calendar days between today and an assessment's "YYYY-MM-DD" due
// date, ignoring time-of-day on both sides so "due today" reads as 0, not a
// fraction of a day.
export function daysUntil(dateStr: string): number {
  const due = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due.getTime() - startOfToday.getTime()) / 86_400_000);
}

export function dueLabel(days: number): string {
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
