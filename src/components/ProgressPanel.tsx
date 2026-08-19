import { computeStats, formatDuration, type HistoryEntry } from "@/lib/pomodoro";

export function ProgressPanel({ history }: { history: HistoryEntry[] }) {
  const stats = computeStats(history);

  return (
    <section className="panel lift p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl">Progress</h2>
        <p className="text-sm text-muted-foreground">Fourteen nights of hard evidence.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "On the case", value: formatDuration(stats.totalMinutes) },
          { label: "Sessions", value: String(stats.totalSessions) },
          { label: "Streak", value: `${stats.streak}d` },
        ].map((s, i) => (
          <div
            key={s.label}
            className="anim-rise space-y-1"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="label-caps">{s.label}</span>
            <p key={s.value} className="anim-rise font-mono text-xl text-gold-soft">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex h-28 items-end gap-1.5">
        {stats.perDay.map((d, i) => {
          const pct = stats.bestDayMinutes ? (d.minutes / stats.bestDayMinutes) * 100 : 0;
          return (
            <div key={d.day} className="group flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="anim-bar w-full rounded-t-sm bg-gold/70 transition-all duration-300 group-hover:bg-gold group-hover:shadow-[0_0_16px_-2px_var(--gold)]"
                  style={{
                    height: `${Math.max(d.minutes > 0 ? 6 : 2, pct)}%`,
                    animationDelay: `${i * 45}ms`,
                  }}
                  title={`${d.day}: ${d.minutes} min`}
                />
              </div>
              <span className="text-[10px] text-smoke transition-colors group-hover:text-gold-soft">
                {new Date(d.day).getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
