"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/utils/cn";
import { CheckCircle2, XCircle } from "lucide-react";

type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  image?: string;
};

export default function QuizPage() {
  const params = useParams();
  const setName = (params?.setName as string) ?? "";

  const [questionList, setQuestionList] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showScore, setShowScore] = useState(false);
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
          setQuestionList((await res.json()) as Question[]);
          setLoading(false);
          return;
        } catch {
          // continue to next folder
        }
      }
      setQuestionList([]);
      setLoading(false);
    };

    loadQuestionSet();
  }, [setName]);

  const handleOptionSelect = useCallback(
    (optionIndex: number) => {
      if (!isAnswered) {
        setUserAnswers((prev) => {
          const updated = [...prev];
          updated[currentQuestion] = optionIndex.toString();
          return updated;
        });
        setIsAnswered(true);
      }
    },
    [isAnswered, currentQuestion],
  );

  const handleNext = useCallback(() => {
    if (currentQuestion < questionList.length - 1) {
      setCurrentQuestion((q) => q + 1);
      setIsAnswered(false);
    } else {
      setShowScore(true);
    }
  }, [currentQuestion, questionList.length]);

  const computeScore = () => {
    let score = 0;
    for (let i = 0; i < questionList.length; i++) {
      if (userAnswers[i] === questionList[i].answer.toString()) {
        score++;
      }
    }
    return score;
  };

  const decodedName = decodeURIComponent(setName);
  const quizTitle = decodedName
    .split("/")
    .pop()!
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const breadcrumbParts = decodedName.split("/").slice(0, -1);

  const currentQ = questionList[currentQuestion];
  const userChoice = userAnswers[currentQuestion];
  const isCorrect = userChoice === currentQ?.answer.toString();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showScore) return;

      if (isAnswered) {
        e.preventDefault();
        handleNext();
        return;
      }

      // Add a check to ensure currentQ is defined
      if (!currentQ) return;

      // Dynamically create keyMap based on the number of options
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

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentQuestion,
    isAnswered,
    showScore,
    currentQ,
    handleNext,
    handleOptionSelect,
  ]);

  const progress = useMemo(
    () =>
      questionList.length ? (currentQuestion / questionList.length) * 100 : 0,
    [currentQuestion, questionList.length],
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-3">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </div>
    );
  }

  // Results view
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
          <div className="relative flex flex-col items-center gap-5 px-6 py-12">
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
              const correct = userAnswers[idx] === q.answer.toString();
              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border space-y-3 px-4 py-4",
                    correct
                      ? "border-green-500/25 bg-green-500/5"
                      : "border-red-500/25 bg-red-500/5",
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5",
                        correct
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-sm font-medium leading-snug">
                      {q.question}
                    </p>
                    {correct ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                    )}
                  </div>
                  {/* Image */}
                  {q.image && (
                    <Image
                      src={`/api/images-serve/${encodeURI(q.image)}`}
                      alt="question"
                      width={400}
                      height={250}
                      className="max-h-48 w-auto rounded-lg border border-border/60 object-contain"
                      unoptimized
                    />
                  )}
                  {/* Answer pills */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        correct
                          ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                          : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
                      )}
                    >
                      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-60">
                        Your answer
                      </span>
                      {q.options[parseInt(userAnswers[idx])]}
                    </div>
                    {!correct && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                        <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-60">
                          Correct answer
                        </span>
                        {q.options[q.answer]}
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
        No questions found for &quot;{setName}&quot;.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress header — minimal */}
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

      {/* Question */}
      <div className="space-y-6 pt-2">
        <p className="text-[1.25rem] font-semibold leading-[1.75] tracking-[-0.01em] text-foreground whitespace-pre-line">
          {currentQ.question}
        </p>
        {currentQ.image && (
          <div>
            <Image
              src={`/api/images-serve/${encodeURI(currentQ.image)}`}
              alt="question"
              width={800}
              height={400}
              className="max-h-64 w-auto rounded border border-border mt-2 object-contain"
              unoptimized
              loading="lazy"
            />
          </div>
        )}

        {/* Answer options */}
        <div className="grid gap-3">
          {currentQ.options.map((option, idx) => {
            const isUserChoice =
              userAnswers[currentQuestion] === idx.toString();
            const isCorrectOption = idx === currentQ.answer;
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
                <span>{option}</span>
              </button>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Press {currentQ.options.map((_, idx) => idx + 1).join("/")} to
            answer
          </p>
        </div>
      </div>

      {/* Explanation */}
      {isAnswered && (
        <div
          className={cn(
            "rounded-lg border-l-2 bg-card px-4 py-3 space-y-2",
            isCorrect ? "border-l-green-500" : "border-l-red-500",
          )}
        >
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <p
              className={cn(
                "text-sm font-semibold",
                isCorrect
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </p>
          </div>
          {!isCorrect && (
            <p className="text-sm text-muted-foreground">
              Correct answer:{" "}
              <span className="font-medium text-green-600 dark:text-green-400">
                {currentQ.options[currentQ.answer]}
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

      {/* Next button */}
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
