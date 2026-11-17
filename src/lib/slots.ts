import { istAt, istWeekday, fmtDateTime } from "./time";

/*
 * Suggested date times for the next 7 days, based on when both people said they're free.
 * Offering a few ready-made times makes saying yes a one-tap decision.
 */
const TIMES: Record<string, { days: number[]; at: [number, number][] }> = {
  weekday_eve: { days: [1, 2, 3, 4, 5], at: [[19, 30]] },
  sat: { days: [6], at: [[11, 0], [17, 0]] },
  sun: { days: [0], at: [[10, 30], [17, 0]] },
};

export function suggestSlots(a: string[], b: string[], now = new Date()) {
  const shared = a.filter((x) => b.includes(x));
  const use = shared.length ? shared : [...new Set([...a, ...b])];
  const out: { iso: string; label: string }[] = [];
  for (let d = 0; d <= 7; d++) {
    const wd = istWeekday(d, now);
    for (const key of use) {
      const t = TIMES[key];
      if (!t || !t.days.includes(wd)) continue;
      for (const [h, m] of t.at) {
        const when = istAt(d, h, m, now);
        if (when.getTime() - now.getTime() < 3 * 36e5) continue; // at least 3 hours' notice
        out.push({ iso: when.toISOString(), label: fmtDateTime(when) });
      }
    }
  }
  return out.sort((x, y) => x.iso.localeCompare(y.iso)).slice(0, 8);
}
