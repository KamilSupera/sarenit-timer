import { formatClock, type Phase } from "@/lib/pomodoro";

type Props = {
  phase: Phase;
  secondsLeft: number;
  progress: number; // 0..1 of current phase
  sessionIndex: number;
  totalSessions: number;
  label: string;
  running?: boolean;
};

const SIZE = 340;
const C = SIZE / 2;
const R_OUTER = 150;
const R_TRACK = 128;
const TICKS = 60;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function TimerDial({
  phase,
  secondsLeft,
  progress,
  sessionIndex,
  totalSessions,
  label,
  running = true,
}: Props) {
  const p = clamp01(progress);
  const circumference = 2 * Math.PI * R_TRACK;
  const isBreak = phase === "break";
  const arcColor = isBreak ? "var(--color-gold-soft)" : "var(--color-gold)";
  const litTicks = Math.round(p * TICKS);

  const sessionsDone = Math.min(sessionIndex, totalSessions);
  const caseProgress =
    totalSessions > 0 ? clamp01((sessionsDone + (phase === "focus" ? p : 0)) / totalSessions) : 0;
  const outerCirc = 2 * Math.PI * R_OUTER;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* soft halo */}
        <div
          className={`absolute inset-6 rounded-full ${running ? "dial-halo" : ""}`}
          style={{
            background: "radial-gradient(circle, oklch(0.8 0.14 78 / 0.16), transparent 70%)",
          }}
        />

        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative">
          {/* case ring (all sessions) */}
          <g transform={`rotate(-90 ${C} ${C})`}>
            <circle cx={C} cy={C} r={R_OUTER} fill="none" stroke="var(--ink)" strokeWidth="7" />
            <circle
              cx={C}
              cy={C}
              r={R_OUTER}
              fill="none"
              stroke="var(--color-gold-soft)"
              strokeOpacity="0.85"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={outerCirc}
              strokeDashoffset={outerCirc * (1 - caseProgress)}
              style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
            />
          </g>

          {/* minute ticks that light up with the phase */}
          <g>
            {Array.from({ length: TICKS }, (_, i) => {
              const angle = (i / TICKS) * 360 - 90;
              const major = i % 5 === 0;
              const lit = i < litTicks;
              const len = major ? 14 : 8;
              const rad = (angle * Math.PI) / 180;
              const x1 = C + (R_TRACK + 8) * Math.cos(rad);
              const y1 = C + (R_TRACK + 8) * Math.sin(rad);
              const x2 = C + (R_TRACK + 8 + len) * Math.cos(rad);
              const y2 = C + (R_TRACK + 8 + len) * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={lit ? arcColor : "var(--color-smoke)"}
                  strokeOpacity={lit ? 0.95 : 0.28}
                  strokeWidth={major ? 3 : 1.5}
                  strokeLinecap="round"
                  style={{ transition: "stroke 0.4s linear, stroke-opacity 0.4s linear" }}
                />
              );
            })}
          </g>

          {/* dial face */}
          <circle
            cx={C}
            cy={C}
            r={R_TRACK}
            fill="var(--ink)"
            fillOpacity="0.55"
            stroke="var(--color-border)"
            strokeWidth="2"
          />

          {/* phase arc */}
          <g transform={`rotate(-90 ${C} ${C})`}>
            <circle
              cx={C}
              cy={C}
              r={R_TRACK}
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="10"
            />
            <circle
              cx={C}
              cy={C}
              r={R_TRACK}
              fill="none"
              stroke={arcColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - p)}
              style={{
                transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)",
                filter: "drop-shadow(0 0 10px oklch(0.8 0.14 78 / 0.55))",
              }}
            />
          </g>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span key={label} className="anim-rise label-caps text-gold-soft">
            {label}
          </span>
          <span
            className={`font-mono text-5xl leading-none tabular-nums text-foreground ${running ? "dial-beat" : "opacity-60"}`}
            style={{ textShadow: "3px 3px 0 var(--ink)" }}
          >
            {formatClock(secondsLeft)}
          </span>
          <span className="text-[0.7rem] tracking-[0.25em] text-smoke uppercase">
            {running ? "clock is running" : "clock is stopped"}
          </span>
        </div>
      </div>

      {/* session film strip */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {Array.from({ length: Math.max(1, totalSessions) }, (_, i) => {
            const done = i < sessionsDone;
            const current = i === sessionsDone;
            return (
              <span
                key={i}
                className="relative h-6 w-6 rounded-sm border-2 transition-all duration-500"
                style={{
                  borderColor: done || current ? "var(--gold)" : "var(--ink)",
                  backgroundColor: done
                    ? "var(--gold)"
                    : current
                      ? "oklch(0.8 0.14 78 / 0.22)"
                      : "var(--color-secondary)",
                  boxShadow: current
                    ? "0 0 16px -2px oklch(0.8 0.14 78 / 0.7)"
                    : "2px 2px 0 var(--ink)",
                }}
              />
            );
          })}
        </div>
        <span className="text-xs tracking-[0.2em] text-smoke uppercase">
          {totalSessions > 0
            ? `Act ${Math.min(sessionsDone + 1, totalSessions)} of ${totalSessions}`
            : "—"}
        </span>
      </div>
    </div>
  );
}
