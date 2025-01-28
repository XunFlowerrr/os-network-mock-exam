import React from "react";
import { Badge } from "./ui/badge";

interface QuizeCardProps {
  title: string;
  description: string | undefined;
  questionCount: number;
}

const QuizeCard: React.FC<QuizeCardProps> = ({
  title,
  description,
  questionCount,
}) => {
  return (
    <div className="w-full h-full flex py-3 px-4">
      <div className="flex flex-col w-full h-full gap-2 items-start justify-between">
        <div>
          <div className="font-bold">{title}</div>
          <div className="text-sm">{description}</div>
          <div className="flex pt-2 gap-2"></div>
        </div>
        <div className="flex">
          <Badge>{`${questionCount} Questions`}</Badge>
        </div>
      </div>
    </div>
  );
};

export default QuizeCard;
