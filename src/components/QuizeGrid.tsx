"use client";
import { IQuestionSetMeta } from "@/lib/database/model/questionSetMeta.model";
import React from "react";
import QuizeCard from "./QuizeCard";
import { useRouter } from "next/navigation";

const QuizeGrid = ({ quizes }: { quizes: IQuestionSetMeta[] }) => {
  const router = useRouter();
  const handleQuizSelect = (id: string) => {
    // open quiz by go to /quiz/:id
    console.log("Selected quiz id:", id);
    router.push(`/quiz/${id}`);
    // Redirect to the quiz page
  };
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      {quizes.map(
        (quiz) => (
          console.log("Quiz:", quiz), // Added logging
          (
            <div
              className="aspect-video rounded-xl bg-muted/50 hover:bg-muted/100 transition-colors"
              key={quiz._id}
              onClick={() => {
                console.log("Quiz selected:", quiz.questionSetId.toString());
                handleQuizSelect(quiz.questionSetId.toString());
              }}
            >
              <QuizeCard
                key={quiz._id}
                title={quiz.title}
                description={quiz.description}
                questionCount={quiz.questionCount}
              />
            </div>
          )
        )
      )}
    </div>
  );
};

export default QuizeGrid;
