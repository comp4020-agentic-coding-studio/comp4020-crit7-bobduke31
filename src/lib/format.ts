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
