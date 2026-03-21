"use client";
import React, { useEffect, useState, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/utils/cn";
import { CheckCircle2, XCircle } from "lucide-react";

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type RandomQuestion = {
  question: string;
  type: "multiple-choice" | "fill-in-blank"; // Add question type
  // Each option is an object with statement and istrue (optional for fill-in-blank)
  options?: { statement: string; istrue: boolean }[];
  correctAnswer?: string; // For fill-in-blank questions
  explanation: string;
  image?: string;
};

export default function RandomQuizPage() {
  const pathname = usePathname();
  // Get search params
  const searchParams = useSearchParams();
  const segments = pathname.split("/").filter(Boolean);
  // Expect path like /quiz/random/<nested...>
  // Find the index of 'random' and join the remainder as relative path
  const randomIdx = segments.indexOf("random");
  const setName =
    randomIdx >= 0
      ? segments.slice(randomIdx + 1).join("/")
      : segments[segments.length - 1];

  // Decode URL encoding (e.g. %20 → space) then split into breadcrumb + title
  const decodedName = decodeURIComponent(setName);
  const nameParts = decodedName.split("/");
  const quizTitle = nameParts[nameParts.length - 1]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const breadcrumbParts = nameParts.slice(0, -1);

  // Determine if randomization is enabled (default is true)
  const isRandomized = searchParams.get("randomize") !== "false";

  const [questionList, setQuestionList] = useState<RandomQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | string)[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestionSet = async () => {
      setLoading(true);
      const candidates = [
        `/api/quiz-data?path=random/${setName}`,
        `/api/quiz-data?path=no-random/${setName}`,
      ];
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          let questions = ((await res.json()) as RandomQuestion[]).filter(
            (q) => q.question && q.type,
          );
          if (isRandomized) {
            questions = shuffleArray(questions);
            questions = questions.map((q) => {
              if (q.type === "multiple-choice" && q.options) {
                return { ...q, options: shuffleArray(q.options) };
              }
              return q;
            });
          }
          setQuestionList(questions);
          setLoading(false);
          return;
        } catch {
          // continue
        }
      }
      setQuestionList([]);
      setLoading(false);
    };
    loadQuestionSet();
  }, [setName, isRandomized]);

  const handleOptionSelect = (optionIndex: number) => {
    if (!isAnswered) {
      const updated = [...userAnswers];
      updated[currentQuestion] = optionIndex;
      setUserAnswers(updated);
      setIsAnswered(true);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnswered && textAnswer.trim()) {
      const updated = [...userAnswers];
      updated[currentQuestion] = textAnswer.trim();
      setUserAnswers(updated);
      setIsAnswered(true);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questionList.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setIsAnswered(false);
      setTextAnswer("");
    } else {
      setShowScore(true);
    }
  };

  const computeScore = () => {
    let score = 0;
    questionList.forEach((q, idx) => {
      const userAnswer = userAnswers[idx];
      if (q.type === "multiple-choice" && q.options) {
        // Find the index of the correct option
        const correctIndex = q.options.findIndex((opt) => opt.istrue);
        if (userAnswer === correctIndex) score++;
      } else if (q.type === "fill-in-blank" && q.correctAnswer) {
        // Compare text answers case-insensitive
        if (
          typeof userAnswer === "string" &&
          userAnswer.toLowerCase() === q.correctAnswer.toLowerCase()
        ) {
          score++;
        }
      }
    });
    return score;
  };

  const currentQ = questionList[currentQuestion];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showScore) return;
      if (isAnswered) {
        e.preventDefault();
        handleNext();
        return;
      }

      if (!currentQ) return;

      // For multiple choice questions, use number keys
      if (currentQ.type === "multiple-choice" && currentQ.options) {
        const keyMap: Record<string, number> = {};
        currentQ.options.forEach((_, idx) => {
          keyMap[(idx + 1).toString()] = idx;
        });
        const pressedKey = e.key;
        if (keyMap[pressedKey] !== undefined) {
          e.preventDefault();
          handleOptionSelect(keyMap[pressedKey]);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, isAnswered, showScore, currentQ]);

  const progress = useMemo(
    () =>
      questionList.length ? (currentQuestion / questionList.length) * 100 : 0,
    [currentQuestion, questionList.length],
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (showScore) {
    const finalScore = computeScore();
    const pct = Math.round((finalScore / questionList.length) * 100);
    const incorrect = questionList.length - finalScore;
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
      <div className="max-w-4xl mx-auto space-y-8 pb-16 fade-in">
        {/* ── Score Hero ── */}
        <div className="rounded-2xl border border-border/60 bg-card">
          <style>{`
            @keyframes ring-fill-${pct}{from{stroke-dashoffset:${circumference.toFixed(2)}}to{stroke-dashoffset:${offset.toFixed(2)}}}
            .ring-anim-${pct}{animation:ring-fill-${pct} 1.2s 0.2s cubic-bezier(0.4,0,0.2,1) both}
          `}</style>
          <div className="flex flex-col items-center gap-5 px-6 py-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/40">
              {quizTitle}
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
                  className="stroke-border/30"
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
                <span className="text-xs font-medium text-muted-foreground/50">
                  %
                </span>
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
              <p className="text-sm text-muted-foreground mt-0.5">
                {finalScore} correct out of {questionList.length}
              </p>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-[16rem]">
              <div className="flex flex-col items-center gap-1 rounded-xl border border-green-500/25 bg-green-500/5 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-extrabold tabular-nums text-green-600 dark:text-green-400">
                  {finalScore}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Correct
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl border border-red-500/25 bg-red-500/5 py-3">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-extrabold tabular-nums text-red-600 dark:text-red-400">
                  {incorrect}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Incorrect
                </span>
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center mt-1">
              <Button
                onClick={() => {
                  setUserAnswers([]);
                  setCurrentQuestion(0);
                  setIsAnswered(false);
                  setShowScore(false);
                  setTextAnswer("");
                }}
                className="px-6"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="px-6"
              >
                Back to Sets
              </Button>
            </div>
          </div>
        </div>

        {/* ── Question Review ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
              Question Review
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
          <div className="grid gap-2">
            {questionList.map((q, idx) => {
              const userAnswer = userAnswers[idx];
              let isCorrect = false;
              let userAnswerDisplay = "";
              let correctAnswerDisplay = "";
              if (q.type === "multiple-choice" && q.options) {
                userAnswerDisplay =
                  typeof userAnswer === "number" &&
                  userAnswer >= 0 &&
                  userAnswer < q.options.length
                    ? q.options[userAnswer].statement
                    : "No answer";
                correctAnswerDisplay =
                  q.options.find((o) => o.istrue)?.statement || "";
                isCorrect =
                  typeof userAnswer === "number" &&
                  !!q.options[userAnswer]?.istrue;
              } else if (q.type === "fill-in-blank" && q.correctAnswer) {
                userAnswerDisplay =
                  typeof userAnswer === "string" ? userAnswer : "No answer";
                correctAnswerDisplay = q.correctAnswer;
                isCorrect =
                  typeof userAnswer === "string" &&
                  userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
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
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                    )}
                  </div>
                  {/* Image */}
                  {q.image && (
                    <img
                      src={`/api/images-serve/${encodeURI(q.image)}`}
                      alt="question"
                      className="max-h-48 w-auto rounded-lg border border-border/60 object-contain"
                    />
                  )}
                  {/* Answer pills */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                      {userAnswerDisplay}
                    </div>
                    {!isCorrect && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                        <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-60">
                          Correct answer
                        </span>
                        {correctAnswerDisplay}
                      </div>
                    )}
                  </div>
                  {/* Explanation */}
                  {q.explanation && (
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">
                        Explanation
                      </span>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 text-muted-foreground">
        No questions found.
      </div>
    );
  }

  const userChoiceIndex =
    typeof userAnswers[currentQuestion] === "number"
      ? (userAnswers[currentQuestion] as number)
      : -1;
  const isCorrectAnswer =
    currentQ.type === "multiple-choice"
      ? (currentQ.options?.[userChoiceIndex]?.istrue ?? false)
      : typeof userAnswers[currentQuestion] === "string" &&
        currentQ.correctAnswer?.toLowerCase() ===
          (userAnswers[currentQuestion] as string).toLowerCase();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress header — minimal, out of the way */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground/35 truncate max-w-[70%]">
            {breadcrumbParts.length > 0
              ? `${breadcrumbParts.join(" › ")} › `
              : ""}
            {quizTitle}
          </p>
          <span className="text-[11px] tabular-nums text-muted-foreground/40 shrink-0">
            {currentQuestion + 1} / {questionList.length}
          </span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Question — the main focus */}
      <div className="space-y-6 pt-2">
        <p className="text-[1.25rem] font-semibold leading-[1.75] tracking-[-0.01em] text-foreground whitespace-pre-line">
          {currentQ.question}
        </p>
        {currentQ.image && (
          <img
            src={`/api/images-serve/${encodeURI(currentQ.image)}`}
            alt="question"
            className="max-h-64 rounded border border-border"
          />
        )}

        {currentQ.type === "multiple-choice" && currentQ.options ? (
          <div className="grid gap-3">
            {currentQ.options.map((option, idx) => {
              const isUserChoice = userAnswers[currentQuestion] === idx;
              const isCorrectOption = option.istrue;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={cn(
                    "group w-full text-left px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring flex items-start gap-3",
                    !isAnswered &&
                      "bg-card hover:bg-accent hover:text-accent-foreground border-border",
                    isAnswered && isCorrectOption && "answer-correct",
                    isAnswered &&
                      isUserChoice &&
                      !isCorrectOption &&
                      "answer-wrong",
                    isAnswered &&
                      !isUserChoice &&
                      !isCorrectOption &&
                      "answer-dimmed",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold mt-0.5 transition-colors",
                      !isAnswered &&
                        "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary",
                      isAnswered &&
                        isCorrectOption &&
                        "bg-green-500/20 text-green-600 dark:text-green-400",
                      isAnswered &&
                        isUserChoice &&
                        !isCorrectOption &&
                        "bg-red-500/20 text-red-600 dark:text-red-400",
                      isAnswered &&
                        !isUserChoice &&
                        !isCorrectOption &&
                        "bg-muted/50 text-muted-foreground/40",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span>{option.statement}</span>
                </button>
              );
            })}
            <p className="text-xs text-muted-foreground">
              Press {currentQ.options.map((_, i) => i + 1).join("/")} to answer
            </p>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="space-y-3">
            <Input
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer here..."
            />
            {!isAnswered && <Button type="submit">Submit Answer</Button>}
            {isAnswered && (
              <div
                className={cn(
                  "rounded-lg border-l-4 px-4 py-3 text-sm space-y-1",
                  isCorrectAnswer
                    ? "border-l-green-500 bg-green-50/60 dark:bg-green-950/25"
                    : "border-l-red-500 bg-red-50/60 dark:bg-red-950/25",
                )}
              >
                <p>
                  Your answer:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      isCorrectAnswer
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {userAnswers[currentQuestion] as string}
                  </span>
                </p>
                {!isCorrectAnswer && (
                  <p>
                    Correct:{" "}
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {currentQ.correctAnswer}
                    </span>
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Press Enter to submit
            </p>
          </form>
        )}
      </div>

      {/* Inline explanation */}
      {isAnswered && (
        <div
          className={cn(
            "rounded-lg border-l-4 px-4 py-3 space-y-2",
            isCorrectAnswer
              ? "border-l-green-500 bg-green-50/60 dark:bg-green-950/25"
              : "border-l-red-500 bg-red-50/60 dark:bg-red-950/25",
          )}
        >
          <div className="flex items-center gap-2">
            {isCorrectAnswer ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <p
              className={cn(
                "text-sm font-semibold",
                isCorrectAnswer
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {isCorrectAnswer ? "Correct" : "Incorrect"}
            </p>
          </div>
          {!isCorrectAnswer && currentQ.type === "multiple-choice" && (
            <p className="text-sm text-muted-foreground">
              Correct answer:{" "}
              <span className="font-medium text-green-600 dark:text-green-400">
                {currentQ.options?.find((o) => o.istrue)?.statement}
              </span>
            </p>
          )}
          {currentQ.explanation && (
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground border-t border-border/40 pt-2 mt-1">
              {currentQ.explanation}
            </p>
          )}
        </div>
      )}

      {isAnswered && (
        <Button onClick={handleNext} size="lg" className="px-8">
          {currentQuestion < questionList.length - 1
            ? "Next Question"
            : "View Results"}
        </Button>
      )}
    </div>
  );
}
