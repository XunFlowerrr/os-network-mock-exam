"use server";

import QuestionSet, { IQuestionSet } from "../database/model/questionSet.model";
import QuestionSetMeta, {
  IQuestionSetMeta,
} from "../database/model/questionSetMeta.model";
import { connectToDatabase } from "../database/mongoose"; // Ensure correct import

export async function getPublicQuestionSetList(): Promise<IQuestionSetMeta[]> {
  try {
    await connectToDatabase();
    const questionSet = await QuestionSetMeta.find({ public: true });
    console.log("Fetched question set:", questionSet); // Added logging
    console.log("Type of question set:", typeof questionSet); // Added logging
    return JSON.parse(JSON.stringify(questionSet));
  } catch (error) {
    console.error("Error fetching question set:", error); // Added error logging
    return [];
  }
}

export async function getQuestionSetById(id: string): Promise<IQuestionSet> {
  try {
    await connectToDatabase();
    const questionSet = await QuestionSet.findById<IQuestionSet>(id);
    console.log("Fetched question set:", questionSet); // Added logging
    console.log("Type of question set:", typeof questionSet); // Added logging
    if (!questionSet) {
      throw new Error("Question set not found");
    }
    console.log("Public field:", questionSet.public); // Added logging
    if (!questionSet.public) {
      throw new Error("Question set is not public");
    }
    return JSON.parse(JSON.stringify(questionSet));
  } catch (error) {
    console.error("Error fetching question set:", error);
    throw error;
  }
}
