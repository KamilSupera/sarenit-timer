export type Phase = "idle" | "scheduled" | "focus" | "break" | "done";

export type ShiftMode = "nightshift" | "dayshift" | "workshift" | "studyshift";

export const SHIFT_MODES: ShiftMode[] = ["nightshift", "dayshift", "workshift", "studyshift"];

export const SHIFT_LABELS: Record<ShiftMode, string> = {
  nightshift: "Nightshift",
  dayshift: "Dayshift",
  workshift: "Workshift",
  studyshift: "Studyshift",
};

export const SHIFT_TAGLINES: Record<ShiftMode, string> = {
  nightshift: "Study P.I. — For Hire",
  dayshift: "Daylight Detective — On the Clock",
  workshift: "The Daily Grind — Punch In",
  studyshift: "The Scholar's Stakeout — Hit the Books",
};

export type PomodoroConfig = {
  subject: string;
  sessions: number;
  focusMinutes: number;
  breakMinutes: number;
  /** MM:SS countdown delay, or "" for start now */
  startAt: string;
  shift: ShiftMode;
};

export type HistoryEntry = {
  id: string;
  subject: string;
  date: string; // ISO
  sessionsPlanned: number;
  sessionsDone: number;
  focusMinutes: number;
  breakMinutes: number;
  minutesFocused: number;
  completed: boolean;
};

export const DEFAULT_CONFIG: PomodoroConfig = {
  subject: "",
  sessions: 4,
  focusMinutes: 25,
  breakMinutes: 5,
  startAt: "",
  shift: "nightshift",
};

const HISTORY_KEY = "nightshift.history.v1";
const CONFIG_KEY = "nightshift.config.v1";

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 100)));
}

export function loadConfig(): PomodoroConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as PomodoroConfig) } : null;
  } catch {
    return null;
  }
}

export function saveConfig(config: PomodoroConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function formatDuration(minutes: number) {
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Milliseconds for a MM:SS countdown delay. */
export function msFromDelay(delay: string) {
  const parts = delay.split(":");
  const m = Number(parts[0]);
  const s = Number(parts[1]);
  if (!Number.isFinite(m) || !Number.isFinite(s)) return 0;
  return (m * 60 + s) * 1000;
}

export type Stats = {
  totalMinutes: number;
  totalSessions: number;
  streak: number;
  perDay: { day: string; minutes: number }[];
  bestDayMinutes: number;
};

export function computeStats(history: HistoryEntry[]): Stats {
  const totalMinutes = history.reduce((sum, h) => sum + h.minutesFocused, 0);
  const totalSessions = history.reduce((sum, h) => sum + h.sessionsDone, 0);

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const byDay = new Map<string, number>();
  for (const h of history) {
    const key = dayKey(new Date(h.date));
    byDay.set(key, (byDay.get(key) ?? 0) + h.minutesFocused);
  }

  const perDay: { day: string; minutes: number }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    perDay.push({ day: dayKey(d), minutes: byDay.get(dayKey(d)) ?? 0 });
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const minutes = byDay.get(dayKey(d)) ?? 0;
    if (minutes > 0) streak++;
    else if (i > 0) break;
  }

  return {
    totalMinutes,
    totalSessions,
    streak,
    perDay,
    bestDayMinutes: Math.max(0, ...perDay.map((p) => p.minutes)),
  };
}
