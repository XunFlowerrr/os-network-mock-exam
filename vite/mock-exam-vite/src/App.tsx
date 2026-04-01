import { useState, useEffect, useMemo, useCallback } from "react";
import "./App.css";
import { QUIZ_SETS, GROUPS } from "./sets";
import type { QuizSet, RandomQuestion } from "./types";
import { ThemeToggle } from "./components/ThemeToggle";
import { ProgressBar } from "./components/ui/ProgressBar";
import { ExplanationSection } from "./components/ExplanationSection";
import {
  FiSearch,
  FiX,
  FiPlay,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { cn } from "./components/utils/cn";

// ─── helpers ────────────────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prepareQuestions(raw: RandomQuestion[]): RandomQuestion[] {
  return shuffleArray(raw).map((q) => {
    if (q.type === "multiple-choice" && q.options) {
      return { ...q, options: shuffleArray(q.options) };
    }
    return q;
  });
}

// ─── Fuzzy search ────────────────────────────────────────────────────────────

function fuzzyScore(str: string, pattern: string): number {
  if (!pattern) return 1;
  const s = str.toLowerCase();
  const p = pattern.toLowerCase();
  if (s.includes(p)) return 1000 + p.length;
  let pi = 0,
    score = 0,
    consec = 0;
  for (let si = 0; si < s.length && pi < p.length; si++) {
    if (s[si] === p[pi]) {
      pi++;
      consec++;
      score += consec * 2;
    } else {
      consec = 0;
    }
  }
  return pi === p.length ? score : -1;
}

// ─── Set Card ────────────────────────────────────────────────────────────────

interface SetCardProps {
  set: QuizSet;
  onSelect: (set: QuizSet) => void;
  showGroup?: boolean;
}

function SetCard({ set, onSelect, showGroup }: SetCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(set)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(set)}
      className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 hover:border-accent transition-all duration-200 cursor-pointer h-[72px] overflow-hidden"
    >
      <p className="text-sm font-medium leading-snug line-clamp-1 pr-12">
        {set.label}
      </p>
      {showGroup && (
        <p className="text-[11px] text-muted uppercase tracking-wide font-medium opacity-60">
          {set.group}
        </p>
      )}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
          <FiPlay className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

// ─── Home View ──────────────────────────────────────────────────────────────

interface HomeViewProps {
  onSelectSet: (set: QuizSet) => void;
}

function HomeView({ onSelectSet }: HomeViewProps) {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("");

  const totalCount = QUIZ_SETS.length;

  const groupCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of QUIZ_SETS) m.set(s.group, (m.get(s.group) ?? 0) + 1);
    return m;
  }, []);

  const filteredSets = useMemo(() => {
    let base = activeGroup
      ? QUIZ_SETS.filter((s) => s.group === activeGroup)
      : QUIZ_SETS;
    if (query) {
      base = base
        .map((s) => ({ s, score: fuzzyScore(s.label, query) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => b.score - a.score)
        .map(({ s }) => s);
    }
    return base;
  }, [query, activeGroup]);

  const isGrouped = !query && !activeGroup;

  return (
    <main className="max-w-4xl mx-auto px-4 pb-10">
      {/* ── Hero ── */}
      <section className="relative pb-12 pt-4">
        {/* Dot-grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 90% 90% at 50% 50%, #000 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 90% at 50% 50%, #000 40%, transparent 100%)",
          }}
        />
        <div className="relative space-y-8">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted">
            Exam Practice
          </p>
          {/* Main headline + big count */}
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-2">
              <h1
                className="font-black leading-none tracking-tighter"
                style={{ fontSize: "clamp(2.8rem, 9vw, 5.5rem)" }}
              >
                <span className="gradient-text block">Master</span>
                <span className="text-foreground block">the exam.</span>
              </h1>
            </div>
            <div className="shrink-0 text-right select-none pb-1">
              <p
                className="font-black tabular-nums leading-none text-accent opacity-[0.15]"
                style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}
              >
                {String(totalCount).padStart(2, "0")}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted mt-1">
                sets
              </p>
            </div>
          </div>
          {/* Search */}
          <div className="relative flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 transition-colors focus-within:border-accent">
            <FiSearch className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search question sets…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="shrink-0 text-muted hover:text-foreground transition-colors"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Group filter pills ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          onClick={() => setActiveGroup("")}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
            !activeGroup
              ? "border-accent bg-accent text-white"
              : "border-border bg-card text-muted hover:border-accent hover:text-foreground",
          )}
        >
          All
          <span
            className={cn(
              "flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
              !activeGroup ? "bg-white/20 text-white" : "bg-border text-muted",
            )}
          >
            {totalCount}
          </span>
        </button>

        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(activeGroup === g ? "" : g)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
              activeGroup === g
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-muted hover:border-accent hover:text-foreground",
            )}
          >
            {g}
            <span
              className={cn(
                "flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                activeGroup === g
                  ? "bg-white/20 text-white"
                  : "bg-border text-muted",
              )}
            >
              {groupCounts.get(g) ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Divider + count ── */}
      <div className="flex items-center gap-4 pt-3 mb-5">
        <div className="h-px flex-1 bg-border" />
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          {activeGroup
            ? `${activeGroup} · ${filteredSets.length}`
            : `${filteredSets.length} sets`}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* ── Sets grid ── */}
      {isGrouped ? (
        <div className="space-y-8">
          {GROUPS.map((g) => {
            const sets = QUIZ_SETS.filter((s) => s.group === g);
            return (
              <section key={g}>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
                  {g}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {sets.map((set) => (
                    <SetCard key={set.id} set={set} onSelect={onSelectSet} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {filteredSets.map((set) => (
            <SetCard key={set.id} set={set} onSelect={onSelectSet} showGroup />
          ))}
        </div>
      )}
    </main>
  );
}

// ─── Quiz View ───────────────────────────────────────────────────────────────

interface QuizViewProps {
  set: QuizSet;
  onBack: () => void;
}

function QuizView({ set, onBack }: QuizViewProps) {
  const [questions, setQuestions] = useState<RandomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | string)[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [showScore, setShowScore] = useState(false);

  // Load and shuffle on mount / set change
  useEffect(() => {
    setLoading(true);
    setCurrent(0);
    setUserAnswers([]);
    setIsAnswered(false);
    setTextAnswer("");
    setShowScore(false);
    set.loader().then((raw) => {
      setQuestions(prepareQuestions(raw));
      setLoading(false);
    });
  }, [set]);

  const currentQ = questions[current];

  const handleOptionSelect = useCallback(
    (idx: number) => {
      if (isAnswered) return;
      const updated = [...userAnswers];
      updated[current] = idx;
      setUserAnswers(updated);
      setIsAnswered(true);
    },
    [isAnswered, userAnswers, current],
  );

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnswered && textAnswer.trim()) {
      const updated = [...userAnswers];
      updated[current] = textAnswer.trim();
      setUserAnswers(updated);
      setIsAnswered(true);
    }
  };

  const handleNext = useCallback(() => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setIsAnswered(false);
      setTextAnswer("");
    } else {
      setShowScore(true);
    }
  }, [current, questions.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showScore) return;
      if (isAnswered) {
        e.preventDefault();
        handleNext();
        return;
      }
      if (!currentQ) return;
      if (currentQ.type === "multiple-choice" && currentQ.options) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < currentQ.options.length) {
          e.preventDefault();
          handleOptionSelect(idx);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showScore, isAnswered, currentQ, handleOptionSelect, handleNext]);

  const progress = useMemo(
    () => (questions.length ? (current / questions.length) * 100 : 0),
    [current, questions.length],
  );

  const computeScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      if (q.type === "multiple-choice" && q.options) {
        if (typeof ans === "number" && q.options[ans]?.istrue) score++;
      } else if (q.type === "fill-in-blank" && q.correctAnswer) {
        if (
          typeof ans === "string" &&
          ans.toLowerCase() === q.correctAnswer.toLowerCase()
        )
          score++;
      }
    });
    return score;
  };

  // ── Results Screen ──────────────────────────────────────────────────────

  if (showScore) {
    const finalScore = computeScore();
    const pct = Math.round((finalScore / questions.length) * 100);
    const incorrect = questions.length - finalScore;
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    const sc =
      pct >= 80
        ? {
            ring: "#22c55e",
            label: "Outstanding!",
            tw: "from-green-500 to-emerald-400",
          }
        : pct >= 60
          ? {
              ring: "#3b82f6",
              label: "Great Work!",
              tw: "from-blue-500 to-indigo-400",
            }
          : pct >= 40
            ? {
                ring: "#f59e0b",
                label: "Keep Practicing",
                tw: "from-amber-500 to-orange-400",
              }
            : {
                ring: "#ef4444",
                label: "Need More Study",
                tw: "from-red-500 to-rose-400",
              };
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8 fade-in">
        {/* ── Score Hero ── */}
        <div className="rounded-2xl border border-border bg-card">
          <style>{`
            @keyframes ring-fill-${pct}{from{stroke-dashoffset:${circumference.toFixed(2)}}to{stroke-dashoffset:${offset.toFixed(2)}}}
            .ring-anim-${pct}{animation:ring-fill-${pct} 1.2s 0.2s cubic-bezier(0.4,0,0.2,1) both}
          `}</style>
          <div className="flex flex-col items-center gap-5 px-6 py-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
              {set.label}
            </p>
            {/* Ring */}
            <div className="relative">
              <svg
                width="180"
                height="180"
                className="-rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  strokeWidth="10"
                  stroke="var(--border)"
                  strokeOpacity="0.3"
                />
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  strokeWidth="10"
                  stroke={sc.ring}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  className={`ring-anim-${pct}`}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "text-[2.8rem] font-black tabular-nums leading-none bg-gradient-to-br bg-clip-text text-transparent",
                    sc.tw,
                  )}
                >
                  {pct}
                </span>
                <span className="text-xs font-medium text-muted">%</span>
              </div>
            </div>
            {/* Label */}
            <div className="text-center -mt-1">
              <p
                className={cn(
                  "text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  sc.tw,
                )}
              >
                {sc.label}
              </p>
              <p className="text-sm text-muted mt-0.5">
                {finalScore} correct out of {questions.length}
              </p>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-[16rem]">
              <div className="flex flex-col items-center gap-1 rounded-xl border border-green-500/25 bg-green-500/5 py-3">
                <FiCheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-extrabold tabular-nums text-green-600 dark:text-green-400">
                  {finalScore}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Correct
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl border border-red-500/25 bg-red-500/5 py-3">
                <FiXCircle className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-extrabold tabular-nums text-red-600 dark:text-red-400">
                  {incorrect}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Incorrect
                </span>
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center mt-1">
              <button
                onClick={() => {
                  setLoading(true);
                  setCurrent(0);
                  setUserAnswers([]);
                  setIsAnswered(false);
                  setTextAnswer("");
                  setShowScore(false);
                  set.loader().then((raw) => {
                    setQuestions(prepareQuestions(raw));
                    setLoading(false);
                  });
                }}
                className="btn-base btn-primary px-6"
              >
                Try Again
              </button>
              <button onClick={onBack} className="btn-base btn-outline px-6">
                Back to Sets
              </button>
            </div>
          </div>
        </div>

        {/* ── Question Review ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Question Review
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2">
            {questions.map((q, idx) => {
              const ans = userAnswers[idx];
              let isCorrect = false;
              let userDisplay = "";
              let correctDisplay = "";

              if (q.type === "multiple-choice" && q.options) {
                userDisplay =
                  typeof ans === "number" && ans >= 0 && ans < q.options.length
                    ? q.options[ans].statement
                    : "No answer";
                correctDisplay =
                  q.options.find((o) => o.istrue)?.statement ?? "";
                isCorrect = typeof ans === "number" && !!q.options[ans]?.istrue;
              } else if (q.type === "fill-in-blank" && q.correctAnswer) {
                userDisplay = typeof ans === "string" ? ans : "No answer";
                correctDisplay = q.correctAnswer;
                isCorrect =
                  typeof ans === "string" &&
                  ans.toLowerCase() === q.correctAnswer.toLowerCase();
              }

              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border space-y-3 px-4 py-4",
                    isCorrect
                      ? "border-green-500/25 bg-green-500/5"
                      : "border-red-500/25 bg-red-500/5",
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5",
                        isCorrect
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-sm font-medium leading-snug">
                      {q.question}
                    </p>
                    {isCorrect ? (
                      <FiCheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                    ) : (
                      <FiXCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                    )}
                  </div>
                  {/* Answer pills */}
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    <div
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        isCorrect
                          ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                          : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
                      )}
                    >
                      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-60">
                        Your answer
                      </span>
                      {userDisplay}
                    </div>
                    {!isCorrect && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                        <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-60">
                          Correct answer
                        </span>
                        {correctDisplay}
                      </div>
                    )}
                  </div>
                  {/* Explanation */}
                  {q.explanation && (
                    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Explanation
                      </span>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-muted">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  // ── Loading guard ──────────────────────────────────────────────────────

  if (loading || !currentQ) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-muted">Loading questions…</p>
      </main>
    );
  }

  // ── Question Screen ────────────────────────────────────────────────────

  const mcCorrectStatement =
    currentQ.type === "multiple-choice"
      ? (currentQ.options?.find((o) => o.istrue)?.statement ?? "")
      : (currentQ.correctAnswer ?? "");

  const mcIsCorrect =
    currentQ.type === "multiple-choice"
      ? !!(
          typeof userAnswers[current] === "number" &&
          currentQ.options?.[userAnswers[current] as number]?.istrue
        )
      : typeof userAnswers[current] === "string" &&
        (userAnswers[current] as string).toLowerCase() ===
          currentQ.correctAnswer?.toLowerCase();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight gradient-text">
            {set.label}
          </h1>
          <span className="text-xs text-muted">
            {current + 1} / {questions.length}
          </span>
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* Question */}
      <div className="space-y-5 fade-in">
        <p className="text-lg font-medium whitespace-pre-line leading-relaxed text-foreground">
          {currentQ.question}
        </p>

        {/* Multiple choice */}
        {currentQ.type === "multiple-choice" && currentQ.options ? (
          <div className="grid gap-3">
            {currentQ.options.map((opt, idx) => {
              const chosen = userAnswers[current] === idx;
              const correct = opt.istrue;
              let styles = "";
              if (isAnswered) {
                if (correct)
                  styles =
                    "border-success bg-success/10 text-success font-medium";
                else if (chosen)
                  styles = "border-danger bg-danger/10 text-danger";
                else styles = "border-border bg-background/60 text-muted";
              } else {
                styles =
                  "border-border bg-card text-foreground hover:border-accent hover:shadow-soft";
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={`text-left px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-accent ${styles}`}
                >
                  <span className="font-mono text-xs mr-2 opacity-60">
                    [{idx + 1}]
                  </span>
                  {opt.statement}
                </button>
              );
            })}
            <p className="text-xs text-muted">
              Press {currentQ.options.map((_, i) => i + 1).join(" / ")} to
              answer
              {isAnswered && " · any key for next"}
            </p>
          </div>
        ) : (
          /* Fill-in-blank */
          <form onSubmit={handleTextSubmit} className="space-y-3">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer and press Enter…"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            {!isAnswered && (
              <button type="submit" className="btn-base btn-primary">
                Submit Answer
              </button>
            )}
            {isAnswered && (
              <div
                className={`p-4 rounded-lg border ${
                  mcIsCorrect
                    ? "border-success bg-success/10"
                    : "border-danger bg-danger/10"
                }`}
              >
                <p className="font-medium text-foreground">
                  Your answer:{" "}
                  <span
                    className={mcIsCorrect ? "text-success" : "text-danger"}
                  >
                    {userAnswers[current] as string}
                  </span>
                </p>
                {!mcIsCorrect && (
                  <p className="mt-1 text-sm">
                    Correct:{" "}
                    <span className="text-success font-medium">
                      {currentQ.correctAnswer}
                    </span>
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted">
              Press Enter to submit{isAnswered && " · any key for next"}
            </p>
          </form>
        )}

        <ExplanationSection
          correctStatement={mcCorrectStatement}
          isCorrect={mcIsCorrect}
          explanation={currentQ.explanation}
          isAnswered={isAnswered}
        />

        {isAnswered && (
          <button onClick={handleNext} className="btn-base btn-primary">
            {current < questions.length - 1
              ? "Next Question →"
              : "View Results"}
          </button>
        )}
      </div>
    </main>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedSet, setSelectedSet] = useState<QuizSet | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setSelectedSet(null)}
            className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity"
          >
            QuizHub
          </button>
          <div className="flex items-center gap-2">
            {selectedSet && (
              <button
                onClick={() => setSelectedSet(null)}
                className="btn-base btn-ghost text-sm text-muted"
              >
                ← Sets
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {selectedSet ? (
        <QuizView set={selectedSet} onBack={() => setSelectedSet(null)} />
      ) : (
        <HomeView onSelectSet={setSelectedSet} />
      )}
    </div>
  );
}
