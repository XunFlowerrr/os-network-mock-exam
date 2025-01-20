import { getDefaultQuestionSetList } from "@/lib/action/questionSet.action";
import { IQuestionSet } from "@/lib/database/model/questionSet.model";
import { IQuestionSetMeta } from "@/lib/database/model/questionSetMeta.model";
import React from "react";

async function Page() {
  const questionSet: IQuestionSetMeta[] = await getDefaultQuestionSetList();

  return (
    <main>
      <h1>Quiz</h1>
      {questionSet.map((set, index) => (
        <div key={index}>
          <h2>{set.title}</h2>
          <p>{set.description}</p>
        </div>
      ))}
    </main>
  );
}

export default Page;
