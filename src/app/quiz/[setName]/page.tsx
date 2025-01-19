"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Question = {
  question: string;
  options: string[];
  answer: string;
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
    import(`@/data/${setName}.json`)
      .then((data) => setQuestionList(data.default as Question[]))
      .catch(() => setQuestionList([]));
  }, [setName]);

  const handleOptionSelect = (optionChar: string) => {
    if (!isAnswered) {
      const updatedAnswers = [...userAnswers];
      updatedAnswers[currentQuestion] = optionChar;
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
      if (userAnswers[i] === questionList[i].answer) {
        score++;
      }
    }
    return score;
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showScore) return;

      if (isAnswered) {
        e.preventDefault();
        handleNext();
        return;
      }

      const keyMap: Record<string, string> = {
        a: "A",
        b: "B",
        c: "C",
        d: "D",
        "1": "A",
        "2": "B",
        "3": "C",
        "4": "D",
      };
      const pressedKey = e.key.toLowerCase();
      if (keyMap[pressedKey]) {
        e.preventDefault();
        handleOptionSelect(keyMap[pressedKey]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentQuestion, isAnswered, showScore]);

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
          const isCorrect = userAnswers[idx] === q.answer;
          return (
            <div key={idx} className="mb-6">
              <p className="font-semibold">
                Question {idx + 1}: {q.question}
              </p>
              <p>
                Your answer:{" "}
                <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                  {userAnswers[idx] || "N/A"}
                </span>
              </p>
              {!isCorrect && (
                <p>
                  Correct answer: <span className="text-green-600">{q.answer}</span>
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

  if (!questionList[currentQuestion]) {
    return <div>Loading questions...</div>;
  }

  const currentQ = questionList[currentQuestion];
  const userChoice = userAnswers[currentQuestion];
  const isCorrect = userChoice === currentQ?.answer;

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-2">{setName} Quiz</h1>
      <p className="mb-4 text-gray-700">
        Question {currentQuestion + 1} of {questionList.length}
      </p>
      <h2 className="text-lg font-medium mb-4">{currentQ.question}</h2>

      <div className="flex flex-col space-y-2 mb-8">
        {currentQ.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionSelect(option.charAt(0))}
            disabled={isAnswered}
            className={`text-start bg-blue-500 bg-opacity-20 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              isAnswered ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {option}
          </button>
        ))}

        <p className="text-sm text-gray-500">
          (You can also press A/B/C/D or 1/2/3/4 on your keyboard)
        </p>
      </div>

      {isAnswered && (
        <div className="mb-8">
          {isCorrect ? (
            <p className="text-green-600 font-semibold">Correct!</p>
          ) : (
            <div>
              <p className="text-red-600 font-semibold">Incorrect!</p>
              <p>
                The correct answer is:{" "}
                <span className="text-green-600">{currentQ.answer}</span>
              </p>
            </div>
          )}
          <p className="mt-2 italic">Explanation: {currentQ.explanation}</p>
        </div>
      )}

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