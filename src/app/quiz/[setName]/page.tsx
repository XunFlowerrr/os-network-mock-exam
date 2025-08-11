"use client";
import React, { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";

type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export default function QuizPage() {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const setName = segments[segments.length - 1];

  const [questionList, setQuestionList] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    import(`@/data/no-random/${setName}.json`)
      .then((data) => setQuestionList(data.default as Question[]))
      .catch(() => setQuestionList([]));
  }, [setName]);

  const handleOptionSelect = (optionIndex: number) => {
    if (!isAnswered) {
      const updatedAnswers = [...userAnswers];
      updatedAnswers[currentQuestion] = optionIndex.toString();
      setUserAnswers(updatedAnswers);
      setIsAnswered(true);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questionList.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setIsAnswered(false);
    } else {
      setShowScore(true);
    }
  };

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
            const correct = userAnswers[idx] === q.answer.toString();
            return (
              <div
                key={idx}
                className="p-5 rounded-lg border border-border bg-card"
              >
                <p className="font-semibold mb-2">
                  Q{idx + 1}. {q.question}
                </p>
                <p className="text-sm">
                  Your answer:{" "}
                  <span
                    className={
                      correct
                        ? "text-success font-medium"
                        : "text-danger font-medium"
                    }
                  >
                    {parseInt(userAnswers[idx]) + 1}
                  </span>
                </p>
                {!correct && (
                  <p className="text-sm mt-1">
                    Correct answer:{" "}
                    <span className="text-success font-medium">
                      {q.answer + 1}
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

  if (!questionList[currentQuestion]) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight gradient-text">
            {setName} Quiz
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
        <div className="grid gap-3">
          {currentQ.options.map((option, idx) => {
            const isUserChoice =
              userAnswers[currentQuestion] === idx.toString();
            const isCorrectOption = idx === currentQ.answer;
            let base =
              "text-left px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2";
            let styles = "";
            if (isAnswered) {
              if (isCorrectOption)
                styles =
                  "border-success bg-success/10 text-success font-medium";
              else if (isUserChoice)
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
                {option}
              </button>
            );
          })}
          <p className="text-xs text-muted">
            Press {currentQ.options.map((_, idx) => idx + 1).join("/")} to
            answer
          </p>
        </div>
      </div>
      {isAnswered && (
        <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
          <p
            className={
              isCorrect
                ? "text-success font-semibold"
                : "text-danger font-semibold"
            }
          >
            {isCorrect ? "Correct!" : "Incorrect"}
          </p>
          {!isCorrect && (
            <p className="text-sm">
              Correct answer:{" "}
              <span className="font-medium text-success">
                {currentQ.options[currentQ.answer]}
              </span>
            </p>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line">
            <span className="font-medium">Explanation:</span>{" "}
            {currentQ.explanation}
          </p>
        </div>
      )}
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
