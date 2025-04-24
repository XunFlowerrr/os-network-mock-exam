"use client";
import React, { useEffect, useState } from "react";
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
};

export default function RandomQuizPage() {
  const pathname = usePathname();
  // Get search params
  const searchParams = useSearchParams();
  const segments = pathname.split("/");
  const setName = segments[segments.length - 1].split("?")[0];

  // Determine if randomization is enabled (default is true)
  const isRandomized = searchParams.get("randomize") !== "false";

  const [questionList, setQuestionList] = useState<RandomQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | string)[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  useEffect(() => {
    import(`@/data/random/${setName}.json`)
      .then((data) => {
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
      })
      .catch(() => setQuestionList([]));
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

  if (showScore) {
    const finalScore = computeScore();
    return (
      <div className="mx-auto max-w-xl p-4">
        <h1 className="text-2xl font-bold mb-4">Quiz Complete!</h1>
        <p className="mb-2">
          You scored{" "}
          <span className="font-semibold">
            {finalScore} / {questionList.length}
          </span>
          .
        </p>
        <hr className="my-4" />
        {questionList.map((q, idx) => {
          const userAnswer = userAnswers[idx];
          let isCorrect = false;
          let userAnswerDisplay = "";
          let correctAnswerDisplay = "";

          if (q.type === "multiple-choice" && q.options) {
            // Get the full statement of the user's answer
            userAnswerDisplay =
              typeof userAnswer === "number" &&
              userAnswer >= 0 &&
              userAnswer < q.options.length
                ? q.options[userAnswer].statement
                : "No answer";

            // Find the correct answer statement
            const correctOption = q.options.find((opt) => opt.istrue);
            correctAnswerDisplay = correctOption ? correctOption.statement : "";

            isCorrect =
              typeof userAnswer === "number" &&
              q.options[userAnswer] &&
              q.options[userAnswer].istrue;
          } else if (q.type === "fill-in-blank" && q.correctAnswer) {
            userAnswerDisplay =
              typeof userAnswer === "string" ? userAnswer : "No answer";
            correctAnswerDisplay = q.correctAnswer;
            isCorrect =
              typeof userAnswer === "string" &&
              userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
          }

          return (
            <div key={idx} className="mb-6">
              <p className="font-semibold">
                Question {idx + 1}: {q.question}
              </p>
              <p>
                Your answer:{" "}
                <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                  {userAnswerDisplay}
                </span>
              </p>
              {!isCorrect && (
                <p>
                  Correct answer:{" "}
                  <span className="text-green-600">{correctAnswerDisplay}</span>
                </p>
              )}
              <p className="mt-2 italic">Explanation: {q.explanation}</p>
              <hr className="mt-4" />
            </div>
          );
        })}
      </div>
    );
  }

  if (!currentQ) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-2">
        {/* Update title based on randomization */}
        {setName} Quiz ({isRandomized ? "Randomized" : "Sequential"})
      </h1>
      <p className="mb-4 text-gray-700">
        Question {currentQuestion + 1} of {questionList.length}
      </p>
      <h2
        className="text-lg font-medium mb-4"
        style={{ whiteSpace: "pre-line" }}
      >
        {currentQ.question}
      </h2>

      {currentQ.type === "multiple-choice" && currentQ.options ? (
        <>
          <div className="flex flex-col space-y-2 mb-8">
            {currentQ.options.map((option, idx) => {
              const userChoice = userAnswers[currentQuestion] === idx;
              const correctChoice = option.istrue;
              let btnClass =
                "text-start px-4 py-2 rounded focus:outline-none focus:ring-2 ";
              if (isAnswered) {
                if (correctChoice) {
                  btnClass += "bg-green-500 text-white ";
                } else if (userChoice) {
                  btnClass += "border-2 border-red-500 ";
                } else {
                  btnClass += "bg-blue-500 bg-opacity-20 ";
                }
              } else {
                btnClass +=
                  "bg-blue-500 bg-opacity-20 hover:bg-blue-600 focus:ring-blue-400 ";
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={btnClass}
                >
                  {option.statement}
                </button>
              );
            })}
            <p className="text-sm text-gray-500">
              (You can also press{" "}
              {currentQ.options.map((_, i) => i + 1).join("/")} on your
              keyboard)
            </p>
          </div>
        </>
      ) : (
        // Fill in the blank question
        <form onSubmit={handleTextSubmit} className="mb-8">
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer here..."
              className="text-background px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" // added text-black for foreground color
            />
            {!isAnswered && (
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Submit Answer
              </button>
            )}
            {isAnswered && (
              <div
                className={`p-4 rounded ${
                  typeof userAnswers[currentQuestion] === "string" &&
                  currentQ.correctAnswer?.toLowerCase() ===
                    userAnswers[currentQuestion].toLowerCase()
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                <p className="font-medium text-background">
                  Your answer: {userAnswers[currentQuestion] as string}
                </p>
                {typeof userAnswers[currentQuestion] === "string" &&
                  currentQ.correctAnswer?.toLowerCase() !==
                    userAnswers[currentQuestion].toLowerCase() && (
                    <p className="font-medium mt-2 text-background">
                      Correct answer:{" "}
                      <span className="text-green-600">
                        {currentQ.correctAnswer}
                      </span>
                    </p>
                  )}
              </div>
            )}
            <p className="text-sm text-gray-500">
              (Press Enter to submit your answer)
            </p>
          </div>
        </form>
      )}

      <ExplanationSection
        correctStatement={
          currentQ.type === "multiple-choice"
            ? currentQ.options?.find((opt) => opt.istrue)?.statement || ""
            : currentQ.correctAnswer || ""
        }
        isCorrect={
          currentQ.type === "multiple-choice"
            ? currentQ.options?.[userAnswers[currentQuestion] as number]
                ?.istrue ?? false
            : Boolean(
                typeof userAnswers[currentQuestion] === "string" &&
                  currentQ.correctAnswer?.toLowerCase() ===
                    userAnswers[currentQuestion].toLowerCase()
              )
        }
        explanation={currentQ.explanation}
        isAnswered={isAnswered}
      />
      {isAnswered && (
        <button
          onClick={handleNext}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          {currentQuestion < questionList.length - 1 ? "Next" : "Show Results"}
        </button>
      )}
    </div>
  );
}
