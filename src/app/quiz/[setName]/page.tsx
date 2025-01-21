"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getQuestionSetById } from "@/lib/action/questionSet.action";

type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type QuizData = {
  title: string;
  description?: string;
  public: boolean;
  ownerId: string;
  questions: Question[];
};

export default function QuizPage() {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const setName = segments[segments.length - 1];

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [questionList, setQuestionList] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showScore, setShowScore] = useState(false);

  // Always call the hooks unconditionally
  useEffect(() => {
    const fetchQuizData = async () => {
      const response = await getQuestionSetById(setName);
      setQuizData(response);
      setQuestionList(response.questions);
      setUserAnswers(Array(response.questions.length).fill(""));
    };
    fetchQuizData();
  }, [setName]);

  // In this hook, we depend on currentQ, so we compute it inside. Notice that
  // we no longer return early from the component.
  const currentQ = questionList[currentQuestion];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showScore) return;

      if (isAnswered) {
        e.preventDefault();
        return handleNext();
      }

      // Only work if there is a current question
      if (!currentQ) return;

      currentQ.options.forEach((_, idx) => {
        if (e.key === (idx + 1).toString()) {
          e.preventDefault();
          handleOptionSelect(idx);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQ, isAnswered, showScore, currentQuestion]);

  const isCorrect =
    currentQ && userAnswers[currentQuestion] === currentQ.answer.toString();

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

  const computeScore = () =>
    questionList.reduce(
      (score, question, index) =>
        score + (userAnswers[index] === question.answer.toString() ? 1 : 0),
      0
    );

  // Instead of returning early from the component, we render a loading state in our UI.
  if (!quizData || !currentQ) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <div>Loading...</div>
      </div>
    );
  }

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
          const answerIsCorrect = userAnswers[idx] === q.answer.toString();
          return (
            <div key={idx} className="mb-6">
              <p className="font-semibold">
                Question {idx + 1}: {q.question}
              </p>
              <p>
                Your answer:{" "}
                <span
                  className={
                    answerIsCorrect ? "text-green-600" : "text-red-600"
                  }
                >
                  {parseInt(userAnswers[idx]) + 1}
                </span>
              </p>
              {!answerIsCorrect && (
                <p>
                  Correct answer:{" "}
                  <span className="text-green-600">{q.answer + 1}</span>
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

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-bold mb-2">{quizData.title} Quiz</h1>
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
        {currentQ.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleOptionSelect(idx)}
            disabled={isAnswered}
            className={`text-start bg-blue-500 bg-opacity-20 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              isAnswered ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {option}
          </button>
        ))}
        <p className="text-sm text-gray-500">
          (You can also press{" "}
          {currentQ.options.map((_, idx) => idx + 1).join("/")} on your
          keyboard)
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
                <span className="text-red-600">
                  {currentQ.options[currentQ.answer]}
                </span>
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
