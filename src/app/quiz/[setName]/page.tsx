"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getQuestionSetById } from "@/lib/action/questionSet.action";
import {
  IQuestion,
  IQuestionSet,
} from "@/lib/database/model/questionSet.model";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import BreadcrumbGenerator from "@/components/BreadcrumbGenerator";

type QuizData = IQuestionSet;

export default function QuizPage() {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const setName = segments[segments.length - 1];
  console.log(`Pathname: ${pathname}`);
  console.log(`Set Name: ${setName}`);

  // State to hold the fetched quiz data
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  // State to hold the list of questions (always initialize as array)
  const [questionList, setQuestionList] = useState<IQuestion[]>([]);

  // State to track the current question index
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // State to track user-selected answers (stores option indices)
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  // State to indicate if the current question has been answered
  const [isAnswered, setIsAnswered] = useState(false);

  // State to control the display of the final score
  const [showScore, setShowScore] = useState(false);

  // Fetch quiz data when the component mounts or setName changes
  useEffect(() => {
    const fetchQuizData = async () => {
      console.log("Starting to fetch quiz data...");
      try {
        const response = await getQuestionSetById(setName);
        console.log("Received Quiz data:", response);

        // Ensure questions array exists, default to empty array
        const questions = response?.questions || [];
        console.log(`Number of questions fetched: ${questions.length}`);

        setQuizData(response);
        setQuestionList(questions);

        // Initialize answers array safely
        setUserAnswers(Array(questions.length).fill(-1));
        console.log(
          "Initialized userAnswers:",
          Array(questions.length).fill(-1)
        );
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        // Handle error state if needed
        setQuizData(null);
        setQuestionList([]);
        setUserAnswers([]);
      }
    };
    fetchQuizData();
  }, [setName]);

  // Get the current question safely
  const currentQ = questionList[currentQuestion];
  console.log(`Current Question Index: ${currentQuestion}`);
  console.log("Current Question:", currentQ);

  // Handle keyboard events for option selection and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log(`Key pressed: ${e.key}`);

      if (showScore) {
        console.log("Quiz is complete. Keyboard input ignored.");
        return;
      }

      if (isAnswered) {
        console.log("Question already answered. Navigating to next question.");
        e.preventDefault();
        return handleNext();
      }

      // Only handle key presses if there's a current question
      if (!currentQ) {
        console.log("No current question available for key handling.");
        return;
      }

      // Check if the pressed key corresponds to an option number
      currentQ.options.forEach((option, idx) => {
        if (e.key === (idx + 1).toString()) {
          console.log(`Option ${idx + 1} selected via keyboard.`);
          e.preventDefault();
          handleOptionSelect(idx);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    console.log("Keyboard event listener added.");

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      console.log("Keyboard event listener removed.");
    };
  }, [currentQ, isAnswered, showScore, currentQuestion]);

  // Determine if the selected answer is correct
  const isCorrect =
    currentQ &&
    userAnswers[currentQuestion] !== -1 &&
    currentQ.options[userAnswers[currentQuestion]]?.isCorrect;
  console.log(`Is the selected answer correct? ${isCorrect}`);

  // Handle the selection of an option
  const handleOptionSelect = (optionIndex: number) => {
    if (!isAnswered) {
      console.log(
        `Option ${optionIndex + 1} selected for Question ${currentQuestion + 1}`
      );
      const updatedAnswers = [...userAnswers];
      updatedAnswers[currentQuestion] = optionIndex;
      setUserAnswers(updatedAnswers);
      console.log("Updated userAnswers:", updatedAnswers);
      setIsAnswered(true);
      console.log("isAnswered set to true.");
    } else {
      console.log(
        "Attempted to select an option, but question is already answered."
      );
    }
  };

  // Handle navigation to the next question or show the final score
  const handleNext = () => {
    if (currentQuestion < questionList.length - 1) {
      console.log(
        `Moving from Question ${currentQuestion + 1} to Question ${
          currentQuestion + 2
        }`
      );
      setCurrentQuestion(currentQuestion + 1);
      setIsAnswered(false);
      console.log("isAnswered reset to false.");
    } else {
      console.log("All questions answered. Showing final score.");
      setShowScore(true);
    }
  };

  // Compute the final score based on correct answers
  const computeScore = () => {
    const score = questionList.reduce(
      (acc, question, index) =>
        acc + (question.options[userAnswers[index]]?.isCorrect ? 1 : 0),
      0
    );
    console.log(`Final Score Computed: ${score} / ${questionList.length}`);
    return score;
  };

  // Render a loading state while fetching data
  if (!quizData || questionList.length === 0) {
    console.log("Rendering loading state.");
    return (
      <div className="mx-auto max-w-xl p-4">
        <div>Loading questions...</div>
      </div>
    );
  }

  // Render the final score after the quiz is completed
  if (showScore) {
    const finalScore = computeScore();
    console.log("Rendering final score.");
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
          const userAnswerIndex = userAnswers[idx];
          const userAnswer = q.options[userAnswerIndex];
          const correctOption = q.options.find((opt) => opt.isCorrect);
          const answerIsCorrect = userAnswer?.isCorrect;

          console.log(
            `Question ${idx + 1}: User Answer: ${
              userAnswerIndex !== -1 ? userAnswerIndex + 1 : "No answer"
            } | Correct: ${
              correctOption ? q.options.indexOf(correctOption) + 1 : "N/A"
            }`
          );

          return (
            <div key={idx} className="mb-6">
              <p className="font-semibold">
                Question {idx + 1}: {q.question}
              </p>
              <p>
                Your answer:{" "}
                {userAnswerIndex !== -1 ? (
                  <span
                    className={
                      answerIsCorrect ? "text-green-600" : "text-red-600"
                    }
                  >
                    {userAnswerIndex + 1}. {userAnswer?.statement}
                  </span>
                ) : (
                  <span className="text-gray-600">No answer selected</span>
                )}
              </p>
              {!answerIsCorrect && correctOption && (
                <p>
                  Correct answer:{" "}
                  <span className="text-green-600">
                    {q.options.indexOf(correctOption) + 1}.{" "}
                    {correctOption.statement}
                  </span>
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

  // Render the current question and its options
  console.log(`Rendering Question ${currentQuestion + 1}`);
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <BreadcrumbGenerator
              context={[
                {
                  name: "Home",
                  url: "/",
                },
                {
                  name: quizData.title,
                  url: "/quiz/" + setName,
                },
              ]}
            />
          </div>
        </header>
        <div className="mx-auto max-w-xl p-4">
          <h1 className="text-2xl font-bold mb-2">{quizData.title} Quiz</h1>
          {/* {quizData.description && (
        <p className="mb-4 text-gray-700">{quizData.description}</p>
      )} */}
          <p className="mb-4 text-gray-700">
            Question {currentQuestion + 1} of {questionList.length}
          </p>
          <h2
            className="text-lg font-medium mb-4"
            style={{ whiteSpace: "pre-line" }}
          >
            {currentQ.question}
          </h2>

          {/* Safe rendering of options */}
          <div className="flex flex-col space-y-2 mb-8">
            {currentQ?.options?.length > 0 ? (
              currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={`text-start bg-blue-500 bg-opacity-20 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    isAnswered ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {idx + 1}. {option.statement}
                </button>
              ))
            ) : (
              <p>No options available for this question.</p>
            )}
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
                  {(() => {
                    const correctOption = currentQ.options.find(
                      (opt) => opt.isCorrect
                    );
                    return (
                      correctOption && (
                        <p>
                          Correct answer:{" "}
                          <span className="text-green-600">
                            {currentQ.options.indexOf(correctOption) + 1}.{" "}
                            {correctOption.statement}
                          </span>
                        </p>
                      )
                    );
                  })()}
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
              {currentQuestion < questionList.length - 1
                ? "Next"
                : "Show Results"}
            </button>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
