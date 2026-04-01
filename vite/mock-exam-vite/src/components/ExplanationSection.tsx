import React from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

interface ExplanationSectionProps {
  correctStatement: string;
  isCorrect: boolean;
  explanation: string;
  isAnswered: boolean;
}

export const ExplanationSection: React.FC<ExplanationSectionProps> = ({
  correctStatement,
  isCorrect,
  explanation,
  isAnswered,
}) => {
  if (!isAnswered) return null;

  return (
    <div
      className={`mb-4 rounded-xl border-l-4 p-4 ${
        isCorrect
          ? "border-green-500 bg-green-50/60 dark:bg-green-950/25"
          : "border-red-500 bg-red-50/60 dark:bg-red-950/25"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {isCorrect ? (
          <FiCheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <FiXCircle className="h-4 w-4 text-red-500 shrink-0" />
        )}
        <span
          className={`font-semibold text-sm ${
            isCorrect
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isCorrect ? "Correct!" : "Incorrect!"}
        </span>
      </div>
      {!isCorrect && correctStatement && (
        <p className="text-sm mb-2">
          Correct Answer:{" "}
          <span className="text-green-600 dark:text-green-400 font-medium">
            {correctStatement}
          </span>
        </p>
      )}
      {explanation && (
        <div className="border-t border-border pt-2 mt-1">
          <p
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{ color: "var(--muted)" }}
          >
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExplanationSection;
