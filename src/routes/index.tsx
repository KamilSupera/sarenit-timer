import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { HistoryPanel } from "@/components/HistoryPanel";
import { ProgressPanel } from "@/components/ProgressPanel";
import { SetupPanel } from "@/components/SetupPanel";
import { ShiftDropdown } from "@/components/ShiftDropdown";
import { TimerDial } from "@/components/TimerDial";
import {
  DEFAULT_CONFIG,
  formatClock,
  loadConfig,
  loadHistory,
  msFromDelay,
  saveConfig,
  saveHistory,
  SHIFT_LABELS,
  SHIFT_TAGLINES,
  type HistoryEntry,
  type Phase,
  type PomodoroConfig,
  type ShiftMode,
} from "@/lib/pomodoro";

const description =
  "A 1930s cartoon-noir detective agency for your studying: hire the clock, pick your sessions and breaks, then track every closed case.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study P.I. For Hire | Cartoon Noir Pomodoro" },
      { name: "description", content: description },
      { property: "og:title", content: "Study P.I. For Hire | Cartoon Noir Pomodoro" },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

const TOTAL_STEPS = 3;

function Index() {
  const [config, setConfig] = useState<PomodoroConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_CONFIG.focusMinutes * 60);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [minutesFocused, setMinutesFocused] = useState(0);
  const [waitMs, setWaitMs] = useState(0);
  const [step, setStep] = useState(1);

  const startedAtRef = useRef<string | null>(null);

  useEffect(() => {
    const stored = loadConfig();
    if (stored) {
      setConfig(stored);
      setSecondsLeft(stored.focusMinutes * 60);
    }
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    document.title = `${SHIFT_LABELS[config.shift]} — ${SHIFT_TAGLINES[config.shift]}`;
  }, [config.shift]);

  const patchConfig = (patch: Partial<PomodoroConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      saveConfig(next);
      if (phase === "idle" && patch.focusMinutes) {
        setSecondsLeft(next.focusMinutes * 60);
      }
      return next;
    });
  };

  const commitHistory = useCallback(
    (done: number, focused: number, completed: boolean) => {
      if (focused <= 0 && done <= 0) return;
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        subject: config.subject,
        date: startedAtRef.current ?? new Date().toISOString(),
        sessionsPlanned: config.sessions,
        sessionsDone: done,
        focusMinutes: config.focusMinutes,
        breakMinutes: config.breakMinutes,
        minutesFocused: Math.round(focused),
        completed,
      };
      setHistory((prev) => {
        const next = [entry, ...prev];
        saveHistory(next);
        return next;
      });
    },
    [config],
  );

  // Scheduled start countdown
  useEffect(() => {
    if (phase !== "scheduled") return;
    const id = window.setInterval(() => {
      const remaining = msFromDelay(config.startAt);
      setWaitMs(remaining);
      if (remaining <= 1000) {
        setPhase("focus");
        setRunning(true);
        setSecondsLeft(config.focusMinutes * 60);
        startedAtRef.current = new Date().toISOString();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, config.startAt, config.focusMinutes]);

  // Main tick
  useEffect(() => {
    if (!running || (phase !== "focus" && phase !== "break")) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phase]);

  // Phase transitions
  useEffect(() => {
    if (secondsLeft > 0 || (phase !== "focus" && phase !== "break")) return;

    if (phase === "focus") {
      const done = sessionIndex + 1;
      const focused = minutesFocused + config.focusMinutes;
      setMinutesFocused(focused);
      if (done >= config.sessions) {
        setRunning(false);
        setPhase("done");
        commitHistory(done, focused, true);
        return;
      }
      setSessionIndex(done);
      setPhase("break");
      setSecondsLeft(config.breakMinutes * 60);
      return;
    }

    setPhase("focus");
    setSecondsLeft(config.focusMinutes * 60);
  }, [secondsLeft, phase, sessionIndex, minutesFocused, config, commitHistory]);

  const start = () => {
    setSessionIndex(0);
    setMinutesFocused(0);
    if (config.startAt) {
      setWaitMs(msFromDelay(config.startAt));
      setPhase("scheduled");
      setRunning(false);
      setSecondsLeft(config.focusMinutes * 60);
      return;
    }
    startedAtRef.current = new Date().toISOString();
    setPhase("focus");
    setSecondsLeft(config.focusMinutes * 60);
    setRunning(true);
  };

  const stop = () => {
    if (phase === "focus" || phase === "break") {
      const partial = phase === "focus" ? (config.focusMinutes * 60 - secondsLeft) / 60 : 0;
      commitHistory(sessionIndex, minutesFocused + partial, false);
    }
    setRunning(false);
    setPhase("idle");
    setSessionIndex(0);
    setMinutesFocused(0);
    setSecondsLeft(config.focusMinutes * 60);
    startedAtRef.current = null;
    setStep(1);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const active = phase === "focus" || phase === "break" || phase === "scheduled";

  const { label, dialSeconds, progress } = useMemo(() => {
    if (phase === "scheduled") {
      return {
        label: "Curtain up in " + config.startAt,
        dialSeconds: Math.round(waitMs / 1000),
        progress: 0,
      };
    }
    if (phase === "done") {
      return { label: "Case closed", dialSeconds: 0, progress: 1 };
    }
    const total = (phase === "break" ? config.breakMinutes : config.focusMinutes) * 60;
    return {
      label: phase === "break" ? "Breathe" : phase === "focus" ? "Focus" : "Standing by",
      dialSeconds: secondsLeft,
      progress: total > 0 ? 1 - secondsLeft / total : 0,
    };
  }, [phase, secondsLeft, waitMs, config]);

  const inSetup = phase === "idle";

  return (
    <main className="noir-stage noir-grain halftone min-h-screen">
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <header className="anim-rise relative z-20 mb-12 border-b-2 border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="anim-slide-left label-caps">
                Est. 1934 · Whisker &amp; Co. Detective Agency
              </p>
              <div key={config.shift}>
                <h1
                  className="anim-rise mt-2 text-5xl leading-none sm:text-7xl"
                  style={{ animationDelay: "0.08s" }}
                >
                  {SHIFT_LABELS[config.shift].replace("shift", "")}
                  <span className="text-gold">shift</span>
                </h1>
                <p
                  className="anim-rise font-caps mt-1 text-xl tracking-[0.3em] text-gold-soft"
                  style={{ animationDelay: "0.16s" }}
                >
                  {SHIFT_TAGLINES[config.shift]}
                </p>
              </div>
              <p
                className="anim-rise mt-4 max-w-md text-base text-muted-foreground italic"
                style={{ animationDelay: "0.24s" }}
              >
                "Every case cracks the same way, kid: one quiet hour, one cup of cold coffee, and
                nobody knocking on the door."
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <label className="label-caps">Shift mode</label>
              <ShiftDropdown value={config.shift} onChange={(shift) => patchConfig({ shift })} />
              <span key={inSetup ? "pending" : phase} className="ink-stamp anim-stamp text-lg">
                {inSetup ? "Case pending" : phase === "done" ? "Case closed" : "On the job"}
              </span>
            </div>
          </div>
        </header>

        {inSetup ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <SetupPanel
              config={config}
              step={step}
              totalSteps={TOTAL_STEPS}
              onChange={patchConfig}
              onNext={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              onBack={() => setStep((s) => Math.max(1, s - 1))}
              onStart={start}
            />
            <div className="space-y-8">
              <div className="anim-rise" style={{ animationDelay: "0.12s" }}>
                <ProgressPanel history={history} />
              </div>
              <div className="anim-rise" style={{ animationDelay: "0.2s" }}>
                <HistoryPanel history={history} onClear={clearHistory} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="panel sweep anim-breathe flex flex-col items-center gap-8 p-8">
              <div className="text-center">
                <p className="label-caps anim-flicker">Now working</p>
                <p className="anim-type mt-1 text-2xl">{config.subject || "Unnamed case"}</p>
              </div>

              <TimerDial
                phase={phase}
                secondsLeft={dialSeconds}
                progress={progress}
                sessionIndex={sessionIndex}
                totalSessions={config.sessions}
                label={label}
                running={running}
              />

              <div className="flex flex-wrap items-center justify-center gap-3">
                {active ? (
                  <>
                    {phase !== "scheduled" ? (
                      <button
                        type="button"
                        onClick={() => setRunning((r) => !r)}
                        className="press rounded-sm bg-gold px-8 py-3 font-caps text-base tracking-[0.2em] text-primary-foreground uppercase hover:opacity-90"
                      >
                        {running ? "Pause" : "Resume"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={stop}
                      className="press rounded-sm border border-border px-6 py-3 font-caps text-base tracking-[0.2em] text-muted-foreground uppercase hover:border-destructive hover:text-destructive"
                    >
                      Walk away
                    </button>
                  </>
                ) : null}

                {phase === "done" ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="press anim-rise rounded-sm border border-gold px-8 py-3 font-caps text-base tracking-[0.2em] text-gold uppercase hover:bg-gold hover:text-primary-foreground"
                  >
                    New case
                  </button>
                ) : null}
              </div>

              <p className="text-center text-xs text-smoke">
                {phase === "done"
                  ? `You logged ${Math.round(minutesFocused)} minutes tonight.`
                  : phase === "scheduled"
                    ? `Starting in ${formatClock(Math.round(waitMs / 1000))}`
                    : `Focus banked this run: ${Math.round(minutesFocused)} min`}
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="anim-rise" style={{ animationDelay: "0.14s" }}>
                <ProgressPanel history={history} />
              </div>
              <div className="anim-rise" style={{ animationDelay: "0.22s" }}>
                <HistoryPanel history={history} onClear={clearHistory} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
