"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
      const folders = ["random", "no-random"];
      for (const folder of folders) {
        try {
          const data = await import(`@/data/${folder}/${setName}.json`);
          setQuestionList(data.default as Question[]);
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
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold gradient-text">Results</h1>
          <p className="text-muted-foreground text-lg">
            You scored{" "}
            <span className="font-bold text-foreground">{finalScore}</span>
            {" / "}
            {questionList.length}
          </p>
          <Progress value={pct} className="max-w-sm mx-auto" />
          <Badge
            variant={
              pct >= 80 ? "default" : pct >= 50 ? "secondary" : "destructive"
            }
            className="text-sm px-4 py-1"
          >
            {pct}%
          </Badge>
        </div>
        <div className="grid gap-4">
          {questionList.map((q, idx) => {
            const correct = userAnswers[idx] === q.answer.toString();
            return (
              <Card
                key={idx}
                className={cn(
                  correct ? "border-green-500/40" : "border-red-500/40",
                )}
              >
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-start gap-2">
                    {correct ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <p className="font-medium leading-snug">
                      Q{idx + 1}. {q.question}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    Your answer:{" "}
                    <span
                      className={cn(
                        "font-medium",
                        correct
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {q.options[parseInt(userAnswers[idx])]}
                    </span>
                  </p>
                  {!correct && (
                    <p className="text-sm text-muted-foreground pl-6">
                      Correct:{" "}
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {q.options[q.answer]}
                      </span>
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-line pl-6 text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Explanation:
                    </span>{" "}
                    {q.explanation}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight gradient-text">
            {setName} Quiz
          </h1>
          <Badge variant="secondary">
            {currentQuestion + 1} / {questionList.length}
          </Badge>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium whitespace-pre-line leading-relaxed">
          {currentQ.question}
        </h2>
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
                  "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
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
                <span className="font-medium mr-2 text-muted-foreground">
                  {idx + 1}.
                </span>
                {option}
              </button>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Press {currentQ.options.map((_, idx) => idx + 1).join("/")} to
            answer
          </p>
        </div>
      </div>

      {/* Explanation card */}
      {isAnswered && (
        <Card
          className={cn(
            isCorrect ? "border-green-500/40" : "border-red-500/40",
          )}
        >
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <p
                className={cn(
                  "font-semibold",
                  isCorrect
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {isCorrect ? "Correct!" : "Incorrect"}
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
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              <span className="font-medium text-foreground">Explanation:</span>{" "}
              {currentQ.explanation}
            </p>
          </CardContent>
        </Card>
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
