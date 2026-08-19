import type { PomodoroConfig } from "@/lib/pomodoro";

type Props = {
  config: PomodoroConfig;
  step: number;
  totalSteps: number;
  onChange: (patch: Partial<PomodoroConfig>) => void;
  onNext: () => void;
  onBack: () => void;
  onStart: () => void;
};

const fieldClass =
  "w-full rounded-sm border border-border bg-secondary px-3 py-2 font-mono text-sm text-foreground outline-none transition-all duration-300 focus:border-gold focus:shadow-[0_0_18px_-6px_var(--gold)] disabled:opacity-50";

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="space-y-2">
      <span className="label-caps">{label}</span>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          className="press w-9 rounded-sm border border-border bg-secondary text-muted-foreground hover:border-gold hover:text-gold"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="flex flex-1 items-baseline justify-center gap-1 rounded-sm border border-border bg-secondary px-2 py-2">
          <span key={value} className="anim-rise font-mono text-lg text-foreground">
            {value}
          </span>
          {suffix ? <span className="text-xs text-smoke">{suffix}</span> : null}
        </div>
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          className="press w-9 rounded-sm border border-border bg-secondary text-muted-foreground hover:border-gold hover:text-gold"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

const STEP_TITLES = ["The case file", "The rounds", "The rendezvous"];
const STEP_HINTS = [
  "Every job needs a name. What are we cracking tonight?",
  "How many acts, and how long do we sit on the clock?",
  "Tell me when to show up — or say the word and we start now.",
];

export function SetupPanel({ config, step, totalSteps, onChange, onNext, onBack, onStart }: Props) {
  const canContinue = step === 1 ? config.subject.trim().length > 0 : true;
  const isLast = step === totalSteps;

  return (
    <section className="panel lift anim-rise p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="label-caps">
            Step {step} of {totalSteps}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i + 1 <= step ? "bg-gold shadow-[0_0_12px_-2px_var(--gold)]" : "bg-secondary"}`}
              />
            ))}
          </div>
        </div>
        <h2 key={`t${step}`} className="anim-rise text-2xl">
          {STEP_TITLES[step - 1]}
        </h2>
        <p
          key={`h${step}`}
          className="anim-rise text-sm text-muted-foreground"
          style={{ animationDelay: "0.06s" }}
        >
          {STEP_HINTS[step - 1]}
        </p>
      </div>

      {step === 1 ? (
        <div key="s1" className="anim-slide-left space-y-2">
          <label className="label-caps" htmlFor="subject">
            Case file
          </label>
          <input
            id="subject"
            className={fieldClass}
            placeholder="The Case of the Organic Chemistry, ch. 4"
            value={config.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div key="s2" className="anim-slide-left grid gap-4 sm:grid-cols-3">
          <Stepper
            label="Sessions"
            value={config.sessions}
            min={1}
            max={12}
            onChange={(sessions) => onChange({ sessions })}
          />
          <Stepper
            label="Focus"
            value={config.focusMinutes}
            min={5}
            max={90}
            step={5}
            suffix="min"
            onChange={(focusMinutes) => onChange({ focusMinutes })}
          />
          <Stepper
            label="Break"
            value={config.breakMinutes}
            min={1}
            max={30}
            suffix="min"
            onChange={(breakMinutes) => onChange({ breakMinutes })}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div key="s3" className="anim-slide-left space-y-4">
          <div className="space-y-2">
            <label className="label-caps" htmlFor="startAt">
              Countdown delay — minutes : seconds (leave empty to begin now)
            </label>
            <div className="flex gap-2">
              <input
                id="startAt"
                type="text"
                inputMode="numeric"
                placeholder="MM:SS"
                pattern="[0-9]{1,2}:[0-5][0-9]"
                className={fieldClass}
                value={config.startAt}
                onChange={(e) => onChange({ startAt: e.target.value })}
              />
              {config.startAt ? (
                <button
                  type="button"
                  onClick={() => onChange({ startAt: "" })}
                  className="press shrink-0 rounded-sm border border-border px-3 font-caps text-sm tracking-[0.15em] text-muted-foreground uppercase hover:border-gold hover:text-gold"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <dl className="grid gap-2 rounded-sm border border-border bg-secondary/50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-smoke">Case</dt>
              <dd className="text-foreground">{config.subject || "Unnamed"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-smoke">Acts</dt>
              <dd className="font-mono text-foreground">
                {config.sessions} × {config.focusMinutes}m / {config.breakMinutes}m
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-smoke">Countdown</dt>
              <dd className="font-mono text-foreground">{config.startAt || "Now"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={onBack}
            className="press rounded-sm border border-border px-5 py-2.5 font-caps text-sm tracking-[0.2em] text-muted-foreground uppercase hover:border-gold hover:text-gold"
          >
            Back
          </button>
        ) : null}
        {isLast ? (
          <button
            type="button"
            onClick={onStart}
            className="press rounded-sm bg-gold px-7 py-2.5 font-caps text-sm tracking-[0.2em] text-primary-foreground uppercase hover:opacity-90"
          >
            {config.startAt ? "Schedule the job" : "Take the case"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className="press rounded-sm bg-gold px-7 py-2.5 font-caps text-sm tracking-[0.2em] text-primary-foreground uppercase hover:opacity-90 disabled:opacity-40"
          >
            Next
          </button>
        )}
        <span className="ml-auto text-xs text-smoke">
          My fee, in time:{" "}
          <span className="text-gold-soft">{config.sessions * config.focusMinutes} min focus</span>{" "}
          + {Math.max(0, config.sessions - 1) * config.breakMinutes} min breaks
        </span>
      </div>
    </section>
  );
}
