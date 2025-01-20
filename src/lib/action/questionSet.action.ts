"use server";

import QuestionSet, { IQuestionSet } from "../database/model/questionSet.model";
import QuestionSetMeta, {
  IQuestionSetMeta,
} from "../database/model/questionSetMeta.model";
import { connectToDatabase } from "../database/mongoose"; // Ensure correct import

export async function getDefaultQuestionSetList(): Promise<IQuestionSetMeta[]> {
  try {
    await connectToDatabase();
    const questionSet = await QuestionSetMeta.find({ defaultLoad: true });
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
    let questionSet = null;
    const defaultQuestionSet = await QuestionSet.find({
      _id: id,
      defaultLoad: true,
    });
    if (!defaultQuestionSet) {
      console.log("Default question set not found"); // Added logging
      questionSet = await QuestionSet.findById(id);
    }
    console.log("Fetched question set by ID:", questionSet); // Added logging
    console.log("Type of question set by ID:", typeof questionSet); // Added logging
    return JSON.parse(JSON.stringify(questionSet));
  } catch (error) {
    console.error("Error fetching question set by ID:", error); // Added error logging
    throw new Error("Error fetching question set by ID");
  }
}
