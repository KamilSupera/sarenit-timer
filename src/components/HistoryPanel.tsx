import { formatDuration, type HistoryEntry } from "@/lib/pomodoro";

type Props = {
  history: HistoryEntry[];
  onClear: () => void;
};

export function HistoryPanel({ history, onClear }: Props) {
  return (
    <section className="panel lift p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl">The Case Files</h2>
          <p className="text-sm text-muted-foreground">Every stakeout, typed up and filed.</p>
        </div>
        {history.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="press rounded-sm border border-border px-3 py-1.5 font-caps text-sm tracking-[0.15em] text-muted-foreground uppercase hover:border-destructive hover:text-destructive"
          >
            Burn it
          </button>
        ) : null}
      </div>

      {history.length === 0 ? (
        <p className="anim-rise py-6 text-center text-sm text-smoke italic">
          No case files yet. The city's quiet... too quiet.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {history.map((h, i) => (
            <li
              key={h.id}
              className="anim-slide-left flex items-center justify-between gap-4 py-3 transition-colors hover:bg-secondary/40"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{h.subject || "Unnamed case"}</p>
                <p className="text-xs text-smoke">
                  {new Date(h.date).toLocaleString(undefined, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}
                  {h.sessionsDone}/{h.sessionsPlanned} sessions
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-gold-soft">
                  {formatDuration(h.minutesFocused)}
                </p>
                <p className="text-[10px] tracking-[0.15em] uppercase text-smoke">
                  {h.completed ? "Closed" : "Cold"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
