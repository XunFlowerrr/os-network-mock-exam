"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  // Each option is an object with statement and istrue
  options: { statement: string; istrue: boolean }[];
  explanation: string;
};

export default function RandomQuizPage() {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const setName = segments[segments.length - 1].split("?")[0];

  const [questionList, setQuestionList] = useState<RandomQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    import(`@/data/random/${setName}.json`)
      .then((data) => {
        let questions = data.default as RandomQuestion[];
        // Always randomize questions for the random quiz
        questions = shuffleArray(questions);

        // Also randomize the options for each question
        questions = questions.map((q) => {
          // Find the correct answer before shuffling
          const correctOption = q.options.find((opt) => opt.istrue);
          // Shuffle the options
          const shuffledOptions = shuffleArray(q.options);
          return {
            ...q,
            options: shuffledOptions,
          };
        });

        setQuestionList(questions);
      })
      .catch(() => setQuestionList([]));
  }, [setName]);

  const handleOptionSelect = (optionIndex: number) => {
    if (!isAnswered) {
      const updated = [...userAnswers];
      updated[currentQuestion] = optionIndex;
      setUserAnswers(updated);
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
    questionList.forEach((q, idx) => {
      // Find the index of the correct option
      const correctIndex = q.options.findIndex((opt) => opt.istrue);
      if (userAnswers[idx] === correctIndex) score++;
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
          const correctIndex = q.options.findIndex((opt) => opt.istrue);
          const isCorrect = userAnswers[idx] === correctIndex;
          return (
            <div key={idx} className="mb-6">
              <p className="font-semibold">
                Question {idx + 1}: {q.question}
              </p>
              <p>
                Your answer:{" "}
                <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                  {userAnswers[idx] !== undefined ? userAnswers[idx] + 1 : "-"}
                </span>
              </p>
              {!isCorrect && (
                <p>
                  Correct answer:{" "}
                  <span className="text-green-600">{correctIndex + 1}</span>
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
        {setName} Quiz (Random Schema)
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
          (You can also press {currentQ.options.map((_, i) => i + 1).join("/")}{" "}
          on your keyboard)
        </p>
      </div>
      <ExplanationSection
        correctStatement={
          currentQ.options.find((opt) => opt.istrue)?.statement || ""
        }
        isCorrect={currentQ.options[userAnswers[currentQuestion]]?.istrue}
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
