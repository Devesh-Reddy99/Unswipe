// All product time logic uses India Standard Time, because "today's intros" must mean today in India.
export const TZ = "Asia/Kolkata";

export function istDay(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function ageFrom(birthDate: string, now: Date = new Date()): number {
  const b = new Date(birthDate + "T00:00:00Z");
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export function fmtDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));
}

export function fmtDay(d: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(d));
}

export function fmtTime(d: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(d));
}

export function hoursLeft(until: Date | string, now: Date = new Date()): number {
  return Math.max(0, Math.round((new Date(until).getTime() - now.getTime()) / 36e5));
}

/** Build a Date for a given IST calendar day offset and IST clock time. */
export function istAt(daysFromToday: number, hour: number, minute = 0, now: Date = new Date()): Date {
  const [y, m, d] = istDay(now).split("-").map(Number);
  // IST is UTC+5:30 with no daylight saving, so this is exact.
  return new Date(Date.UTC(y, m - 1, d + daysFromToday, hour - 5, minute - 30));
}

/** Weekday of an IST day offset: 0 = Sunday. */
export function istWeekday(daysFromToday: number, now: Date = new Date()): number {
  return istAt(daysFromToday, 12, 0, now).getUTCDay();
}
