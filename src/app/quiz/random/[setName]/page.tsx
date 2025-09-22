"use client";
import React, { useEffect, useState, useMemo } from "react";
// Import useSearchParams
import { usePathname, useSearchParams } from "next/navigation";
import ExplanationSection from "@/components/ExplanationSection";

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

  // Determine if randomization is enabled (default is true)
  const isRandomized = searchParams.get("randomize") !== "false";

  const [questionList, setQuestionList] = useState<RandomQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | string)[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  useEffect(() => {
    // Try to load from different folders
    const loadQuestionSet = async () => {
      // Attempt to import by nested path directly first (random/<path>.json)
      const candidates = [
        `@/data/random/${setName}.json`,
        `@/data/no-random/${setName}.json`,
      ];
      for (const candidate of candidates) {
        try {
          const data = await import(/* @vite-ignore */ candidate);
          let questions = data.default as RandomQuestion[];

          // Conditionally randomize questions
          if (isRandomized) {
            questions = shuffleArray(questions);

            // Conditionally randomize options for multiple-choice questions
            questions = questions.map((q) => {
              if (q.type === "multiple-choice" && q.options) {
                const shuffledOptions = shuffleArray(q.options);
                return {
                  ...q,
                  options: shuffledOptions,
                };
              }
              return q;
            });
          }
          // If not randomized, questions and options remain in their original order

          setQuestionList(questions);
          return; // Successfully loaded, exit the loop
        } catch (error) {
          // Continue to next folder
        }
      }
      // If no folder contains the set, set empty array
      setQuestionList([]);
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
    [currentQuestion, questionList.length]
  );

  if (showScore) {
    const finalScore = computeScore();
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">Results</h1>
          <p className="text-muted">
            You scored {finalScore} / {questionList.length}
          </p>
        </div>
        <div className="grid gap-6">
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
              const correctOption = q.options.find((o) => o.istrue);
              correctAnswerDisplay = correctOption?.statement || "";
              isCorrect =
                typeof userAnswer === "number" && q.options[userAnswer]?.istrue;
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
                className="p-5 rounded-lg border border-border bg-card"
              >
                <p className="font-semibold mb-2">
                  Q{idx + 1}. {q.question}
                </p>
                {q.image && (
                  <div>
                    <img
                      src={`/api/images-serve/${encodeURI(q.image)}`}
                      alt="question"
                      className="max-h-64 rounded border border-border mt-2"
                    />
                  </div>
                )}
                <p className="text-sm">
                  Your answer:{" "}
                  <span
                    className={
                      isCorrect
                        ? "text-success font-medium"
                        : "text-danger font-medium"
                    }
                  >
                    {userAnswerDisplay}
                  </span>
                </p>
                {!isCorrect && (
                  <p className="text-sm mt-1">
                    Correct answer:{" "}
                    <span className="text-success font-medium">
                      {correctAnswerDisplay}
                    </span>
                  </p>
                )}
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">
                  <span className="font-medium">Explanation:</span>{" "}
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight gradient-text">
            {setName} Quiz {isRandomized ? "(Randomized)" : "(Sequential)"}
          </h1>
          <span className="text-xs text-muted">
            {currentQuestion + 1}/{questionList.length}
          </span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-lg font-medium whitespace-pre-line leading-relaxed">
          {currentQ.question}
        </h2>
        {currentQ.image && (
          <div>
            <img
              src={`/api/images-serve/${encodeURI(currentQ.image)}`}
              alt="question"
              className="max-h-64 rounded border border-border mt-2"
            />
          </div>
        )}

        {currentQ.type === "multiple-choice" && currentQ.options ? (
          <div className="grid gap-3">
            {currentQ.options.map((option, idx) => {
              const userChoice = userAnswers[currentQuestion] === idx;
              const correctChoice = option.istrue;
              let base =
                "text-left px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2";
              let styles = "";
              if (isAnswered) {
                if (correctChoice)
                  styles =
                    "border-success bg-success/10 text-success font-medium";
                else if (userChoice)
                  styles = "border-danger bg-danger/10 text-danger";
                else styles = "border-border bg-background/60";
              } else {
                styles =
                  "border-border bg-card hover:border-accent hover:shadow-soft";
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={`${base} ${styles}`}
                >
                  {option.statement}
                </button>
              );
            })}
            <p className="text-xs text-muted">
              Press {currentQ.options.map((_, i) => i + 1).join("/")} to answer
            </p>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="space-y-3">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer here..."
              className="px-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent w-full"
            />
            {!isAnswered && (
              <button type="submit" className="btn-primary px-6 py-3">
                Submit Answer
              </button>
            )}
            {isAnswered && (
              <div
                className={`p-4 rounded-lg border ${
                  typeof userAnswers[currentQuestion] === "string" &&
                  currentQ.correctAnswer?.toLowerCase() ===
                    (userAnswers[currentQuestion] as string).toLowerCase()
                    ? "border-success bg-success/10"
                    : "border-danger bg-danger/10"
                }`}
              >
                <p className="font-medium">
                  Your answer: {userAnswers[currentQuestion] as string}
                </p>
                {typeof userAnswers[currentQuestion] === "string" &&
                  currentQ.correctAnswer?.toLowerCase() !==
                    (userAnswers[currentQuestion] as string).toLowerCase() && (
                    <p className="mt-2 text-sm">
                      Correct answer:{" "}
                      <span className="text-success font-medium">
                        {currentQ.correctAnswer}
                      </span>
                    </p>
                  )}
              </div>
            )}
            <p className="text-xs text-muted">Press Enter to submit</p>
          </form>
        )}
      </div>

      <ExplanationSection
        correctStatement={
          currentQ.type === "multiple-choice"
            ? currentQ.options?.find((o) => o.istrue)?.statement || ""
            : currentQ.correctAnswer || ""
        }
        isCorrect={
          currentQ.type === "multiple-choice"
            ? currentQ.options?.[userAnswers[currentQuestion] as number]
                ?.istrue ?? false
            : Boolean(
                typeof userAnswers[currentQuestion] === "string" &&
                  currentQ.correctAnswer?.toLowerCase() ===
                    (userAnswers[currentQuestion] as string).toLowerCase()
              )
        }
        explanation={currentQ.explanation}
        isAnswered={isAnswered}
      />
      {isAnswered && (
        <button onClick={handleNext} className="btn-primary px-6 py-3">
          {currentQuestion < questionList.length - 1
            ? "Next Question"
            : "View Results"}
        </button>
      )}
    </div>
  );
}
